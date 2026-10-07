import crypto from "crypto";
import { QueryFilter, Types } from "mongoose";
import razorpay from "../../config/razorpay";
import { IFeaturedEventRequest } from "./featured-event.interface";
import Event from "../event/event.model";
import FeaturedEventRequest from "./featured-event-request.model";
import { buildPaginationMetadata, escapeRegExp, ParsedPaginationQuery } from "../../utils/pagination";
import { getStartOfDay, hasEventEnded } from "../../utils/eventLifecycle";
import { CreateFeaturedEventRequestInput, VerifyFeaturedEventPaymentInput } from "./featured-event.validation";

import { ensureFeaturedHomepageCapacity } from "./admin.helpers";
import { defaultPaginationQuery, requestPopulate } from "./constants";
import { createPaymentOrderForRequest, ensureNoOpenFeaturedRequest, getEventOwnedByOrganizerOrThrow, getFeaturedRequestEventOrThrow, getFeaturedRequestSort, getObjectIdOrThrow, getPopulatedFeaturedRequest, isFinalStatus, isRequestStatus, normalizePromotionPeriod, signaturesMatch, toRazorpayPaise, withFeaturedSlotMutationLock } from "./helpers";
import { syncFeaturedEventRequestStates } from "./lifecycle.service";
import { getFeaturedEventSettingsService } from "./settings.service";
import { FeaturedEventServiceError } from "./types";

export const getEligibleFeaturedEventsForOrganizerService = async (organizerId: string) => {
    const now = new Date();
    const events = await Event.find({
        organizer: organizerId,
        status: "published",
        eventDate: {
            $gte: getStartOfDay(now),
        },
    })
        .sort({
        eventDate: 1,
    })
        .select("title category city venue eventDate startTime endTime ticketPrice bannerImage status organizer");
    return events.filter((event) => !hasEventEnded(event.eventDate, event.endTime, now));
};

export const createFeaturedEventRequestService = async (organizerId: string, data: CreateFeaturedEventRequestInput) => {
    const setting = await getFeaturedEventSettingsService();
    if (!setting.isPromotionEnabled) {
        throw new FeaturedEventServiceError("Featured event promotion is currently disabled.", 403);
    }
    const event = await getEventOwnedByOrganizerOrThrow(data.eventId, organizerId);
    await ensureNoOpenFeaturedRequest(event._id, new Date());
    const { startDate, endDate } = normalizePromotionPeriod(data.requestedStartDate, data.requestedEndDate, event);
    const request = await FeaturedEventRequest.create({
        organizer: new Types.ObjectId(organizerId),
        event: event._id,
        promotionFee: setting.promotionFee,
        currency: "INR",
        requestedStartDate: startDate,
        requestedEndDate: endDate,
        status: "pending",
        paymentStatus: setting.promotionFee > 0 &&
            setting.requirePaymentBeforeApproval
            ? "unpaid"
            : "paid",
        paidAt: setting.promotionFee > 0 &&
            setting.requirePaymentBeforeApproval
            ? undefined
            : new Date(),
        isActive: false,
    });
    return {
        request: await getPopulatedFeaturedRequest(request._id),
        order: null,
        key: process.env.RAZORPAY_KEY_ID,
        paymentRequired: false,
    };
};

export const createFeaturedEventPaymentOrderService = async (organizerId: string, requestId: string) => {
    const requestObjectId = getObjectIdOrThrow(requestId, "featured request ID");
    await syncFeaturedEventRequestStates();
    const request = await FeaturedEventRequest.findOne({
        _id: requestObjectId,
        organizer: organizerId,
    });
    if (!request) {
        throw new FeaturedEventServiceError("Featured event request not found.", 404);
    }
    if (isFinalStatus(request.status)) {
        throw new FeaturedEventServiceError("Payment cannot be made for this request.", 400);
    }
    if (request.status !== "payment_pending") {
        throw new FeaturedEventServiceError("Admin approval and a reserved promotion period are required before payment.", 400);
    }
    if (request.paymentStatus === "paid") {
        throw new FeaturedEventServiceError("This featured promotion has already been paid.", 400);
    }
    if (!request.approvedStartDate ||
        !request.approvedEndDate) {
        throw new FeaturedEventServiceError("Approved promotion dates are required before payment.", 400);
    }
    if (request.promotionFee <= 0) {
        throw new FeaturedEventServiceError("No payment is required for this featured promotion.", 400);
    }
    const now = new Date();
    if (!request.paymentReservationExpiresAt ||
        request.paymentReservationExpiresAt <= now) {
        request.status = "expired";
        request.isActive = false;
        await request.save();
        throw new FeaturedEventServiceError("The reserved featured slot has expired. Please submit a new request.", 410);
    }
    await getFeaturedRequestEventOrThrow(request);
    await ensureFeaturedHomepageCapacity(request._id, request.approvedStartDate, request.approvedEndDate);
    if (request.razorpayOrderId &&
        request.paymentStatus === "pending") {
        const existingOrder = await razorpay.orders.fetch(request.razorpayOrderId);
        if (Number(existingOrder.amount) ===
            toRazorpayPaise(request.promotionFee)) {
            return {
                request: await getPopulatedFeaturedRequest(request._id),
                order: existingOrder,
                amountToPay: request.promotionFee,
                key: process.env.RAZORPAY_KEY_ID,
            };
        }
    }
    const order = await createPaymentOrderForRequest(request);
    return {
        request: await getPopulatedFeaturedRequest(request._id),
        order,
        amountToPay: request.promotionFee,
        key: process.env.RAZORPAY_KEY_ID,
    };
};

export const verifyFeaturedEventPaymentService = async (organizerId: string, data: VerifyFeaturedEventPaymentInput) => {
    const requestObjectId = getObjectIdOrThrow(data.requestId, "featured request ID");
    const request = await FeaturedEventRequest.findOne({
        _id: requestObjectId,
        organizer: organizerId,
    }).select("+razorpaySignature");
    if (!request) {
        throw new FeaturedEventServiceError("Featured event request not found.", 404);
    }
    if (request.paymentStatus === "paid") {
        return {
            success: true,
            request: await getPopulatedFeaturedRequest(request._id),
            message: "Featured promotion payment is already verified.",
        };
    }
    if (isFinalStatus(request.status)) {
        throw new FeaturedEventServiceError("Payment cannot be verified for this request.", 400);
    }
    if (request.status !== "payment_pending") {
        throw new FeaturedEventServiceError("Admin approval and a reserved promotion period are required before payment verification.", 400);
    }
    if (!request.approvedStartDate ||
        !request.approvedEndDate) {
        throw new FeaturedEventServiceError("Approved promotion dates are required before payment verification.", 400);
    }
    const verificationStartedAt = new Date();
    if (!request.paymentReservationExpiresAt ||
        request.paymentReservationExpiresAt <=
            verificationStartedAt) {
        request.status = "expired";
        request.isActive = false;
        await request.save();
        throw new FeaturedEventServiceError("The reserved featured slot has expired. Please submit a new request.", 410);
    }
    if (!request.razorpayOrderId) {
        throw new FeaturedEventServiceError("Razorpay order was not created for this featured request.", 400);
    }
    if (request.razorpayOrderId !== data.razorpay_order_id) {
        throw new FeaturedEventServiceError("Razorpay order ID mismatch.", 400);
    }
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        throw new FeaturedEventServiceError("Razorpay key secret is not configured.", 500);
    }
    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${request.razorpayOrderId}|${data.razorpay_payment_id}`)
        .digest("hex");
    if (!signaturesMatch(expectedSignature, data.razorpay_signature)) {
        request.paymentStatus = "failed";
        await request.save();
        throw new FeaturedEventServiceError("Invalid payment signature.", 400);
    }
    const payment = await razorpay.payments.fetch(data.razorpay_payment_id);
    if (payment.order_id !== request.razorpayOrderId) {
        throw new FeaturedEventServiceError("Payment does not belong to this featured promotion order.", 400);
    }
    if (Number(payment.amount) !==
        toRazorpayPaise(request.promotionFee)) {
        throw new FeaturedEventServiceError("Payment amount does not match the featured promotion fee.", 400);
    }
    if (payment.currency !== request.currency) {
        throw new FeaturedEventServiceError("Invalid payment currency.", 400);
    }
    if (payment.status !== "captured") {
        throw new FeaturedEventServiceError("Payment has not been captured.", 400);
    }
    const updatedRequest = await withFeaturedSlotMutationLock(async () => {
        const now = new Date();
        await syncFeaturedEventRequestStates(now);
        const latestRequest = await FeaturedEventRequest.findOne({
            _id: request._id,
            organizer: organizerId,
        }).select("+razorpaySignature");
        if (!latestRequest) {
            throw new FeaturedEventServiceError("Featured event request not found.", 404);
        }
        if (latestRequest.paymentStatus === "paid") {
            return latestRequest;
        }
        if (latestRequest.status !== "payment_pending" ||
            latestRequest.razorpayOrderId !==
                request.razorpayOrderId ||
            !latestRequest.approvedStartDate ||
            !latestRequest.approvedEndDate ||
            !latestRequest.paymentReservationExpiresAt ||
            latestRequest.paymentReservationExpiresAt <=
                now) {
            if (latestRequest.status === "payment_pending") {
                latestRequest.status = "expired";
                latestRequest.isActive = false;
                await latestRequest.save();
            }
            throw new FeaturedEventServiceError("Payment verification could not be completed because the reserved slot is no longer available.", 409);
        }
        await getFeaturedRequestEventOrThrow(latestRequest);
        await ensureFeaturedHomepageCapacity(latestRequest._id, latestRequest.approvedStartDate, latestRequest.approvedEndDate);
        const finalizedRequest = await FeaturedEventRequest.findOneAndUpdate({
            _id: latestRequest._id,
            organizer: organizerId,
            status: "payment_pending",
            paymentStatus: {
                $ne: "paid",
            },
            razorpayOrderId: latestRequest.razorpayOrderId,
            paymentReservationExpiresAt: {
                $gt: now,
            },
        }, {
            $set: {
                razorpayPaymentId: data.razorpay_payment_id,
                razorpaySignature: data.razorpay_signature,
                paymentStatus: "paid",
                status: "approved",
                paidAt: now,
                isActive: true,
            },
            $unset: {
                paymentReservationExpiresAt: "",
            },
        }, {
            new: true,
        });
        if (!finalizedRequest) {
            const latestPaidRequest = await FeaturedEventRequest.findById(request._id);
            if (latestPaidRequest?.paymentStatus === "paid") {
                return latestPaidRequest;
            }
            throw new FeaturedEventServiceError("Payment verification could not be completed.", 400);
        }
        return finalizedRequest;
    });
    await syncFeaturedEventRequestStates();
    return {
        success: true,
        request: await getPopulatedFeaturedRequest(updatedRequest._id),
        message: "Featured promotion payment verified successfully.",
    };
};

export const getOrganizerFeaturedRequestsService = async (organizerId: string, query: ParsedPaginationQuery = defaultPaginationQuery) => {
    await syncFeaturedEventRequestStates();
    const filter: QueryFilter<IFeaturedEventRequest> = {
        organizer: organizerId,
    };
    if (query.status &&
        query.status.toLowerCase() !== "all") {
        const normalizedStatus = query.status.toLowerCase();
        if (isRequestStatus(normalizedStatus)) {
            filter.status = normalizedStatus;
        }
    }
    if (query.search) {
        const searchRegex = new RegExp(escapeRegExp(query.search), "i");
        const matchingEvents = await Event.find({
            organizer: organizerId,
            $or: [
                { title: searchRegex },
                { category: searchRegex },
                { venue: searchRegex },
                { city: searchRegex },
            ],
        }).select("_id");
        filter.event = {
            $in: matchingEvents.map((event) => event._id),
        };
    }
    const [requests, totalItems] = await Promise.all([
        FeaturedEventRequest.find(filter)
            .populate(requestPopulate)
            .sort(getFeaturedRequestSort(query.sort))
            .skip(query.skip)
            .limit(query.limit),
        FeaturedEventRequest.countDocuments(filter),
    ]);
    return {
        success: true,
        message: "Featured event requests fetched successfully.",
        data: requests,
        requests,
        pagination: buildPaginationMetadata(query.page, query.limit, totalItems),
    };
};

export const cancelOrganizerFeaturedRequestService = async (organizerId: string, requestId: string) => {
    const requestObjectId = getObjectIdOrThrow(requestId, "featured request ID");
    const request = await FeaturedEventRequest.findOne({
        _id: requestObjectId,
        organizer: organizerId,
    });
    if (!request) {
        throw new FeaturedEventServiceError("Featured event request not found.", 404);
    }
    if (request.paymentStatus === "paid" ||
        request.status === "approved") {
        throw new FeaturedEventServiceError("Paid or approved featured requests cannot be cancelled from this flow.", 400);
    }
    if (request.status !== "pending" &&
        request.status !== "payment_pending") {
        throw new FeaturedEventServiceError("This featured request cannot be cancelled.", 400);
    }
    request.status = "cancelled";
    request.isActive = false;
    request.paymentReservationExpiresAt = undefined;
    await request.save();
    return {
        success: true,
        message: "Featured event request cancelled successfully.",
        request: await getPopulatedFeaturedRequest(request._id),
    };
};

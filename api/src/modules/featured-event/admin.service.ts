import { Types } from "mongoose";
import FeaturedEventRequest from "./featured-event-request.model";
import { buildPaginationMetadata } from "../../utils/pagination";
import { ApproveFeaturedEventRequestInput, RejectFeaturedEventRequestInput, UpdateFeaturedEventRequestInput } from "./featured-event.validation";

import { buildAdminFeaturedRequestFilter, ensureFeaturedHomepageCapacity, getRequestEventOrThrow } from "./admin.helpers";
import { defaultPaginationQuery, requestPopulate } from "./constants";
import { getFeaturedRequestSort, getObjectIdOrThrow, getPaymentReservationExpiry, getPopulatedFeaturedRequest, isFinalStatus, normalizePromotionPeriod, withFeaturedSlotMutationLock } from "./helpers";
import { syncFeaturedEventRequestStates } from "./lifecycle.service";
import { getFeaturedEventSettingsService } from "./settings.service";
import { FeaturedEventAdminQuery, FeaturedEventServiceError } from "./types";

export const getAdminFeaturedRequestsService = async (query: FeaturedEventAdminQuery = defaultPaginationQuery) => {
    await syncFeaturedEventRequestStates();
    const filter = await buildAdminFeaturedRequestFilter(query);
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
        message: "Admin featured event requests fetched successfully.",
        data: requests,
        requests,
        pagination: buildPaginationMetadata(query.page, query.limit, totalItems),
    };
};

export const approveFeaturedEventRequestService = async (adminId: string, requestId: string, data: ApproveFeaturedEventRequestInput) => {
    const requestObjectId = getObjectIdOrThrow(requestId, "featured request ID");
    return withFeaturedSlotMutationLock(async () => {
        await syncFeaturedEventRequestStates();
        const setting = await getFeaturedEventSettingsService();
        const request = await getPopulatedFeaturedRequest(requestObjectId);
        if (request.status === "approved") {
            throw new FeaturedEventServiceError("This request is already approved.", 400);
        }
        if (request.status === "payment_pending") {
            throw new FeaturedEventServiceError("This request already has a reserved promotion slot awaiting payment.", 400);
        }
        if (request.status !== "pending") {
            throw new FeaturedEventServiceError("Only pending featured requests can be approved.", 400);
        }
        if (isFinalStatus(request.status)) {
            throw new FeaturedEventServiceError("This request cannot be approved.", 400);
        }
        const event = getRequestEventOrThrow(request);
        const { startDate, endDate } = normalizePromotionPeriod(data.approvedStartDate ||
            request.requestedStartDate, data.approvedEndDate ||
            request.requestedEndDate, event, {
            allowPastStart: true,
        });
        await ensureFeaturedHomepageCapacity(request._id, startDate, endDate);
        const now = new Date();
        const requiresPayment = setting.requirePaymentBeforeApproval &&
            request.promotionFee > 0;
        request.status = requiresPayment
            ? "payment_pending"
            : "approved";
        request.paymentStatus = requiresPayment
            ? "unpaid"
            : "paid";
        request.paidAt = requiresPayment
            ? undefined
            : request.paidAt || now;
        request.paymentReservationExpiresAt =
            requiresPayment
                ? getPaymentReservationExpiry(now)
                : undefined;
        request.approvedStartDate = startDate;
        request.approvedEndDate = endDate;
        request.approvedAt = now;
        request.approvedBy =
            new Types.ObjectId(adminId);
        request.adminNote = data.adminNote || "";
        request.rejectionReason = "";
        request.isActive = !requiresPayment;
        await request.save();
        await syncFeaturedEventRequestStates();
        return getPopulatedFeaturedRequest(request._id);
    });
};

export const rejectFeaturedEventRequestService = async (_adminId: string, requestId: string, data: RejectFeaturedEventRequestInput) => {
    const request = await FeaturedEventRequest.findById(getObjectIdOrThrow(requestId, "featured request ID"));
    if (!request) {
        throw new FeaturedEventServiceError("Featured event request not found.", 404);
    }
    if (request.status === "approved") {
        throw new FeaturedEventServiceError("Approved requests should be deactivated instead of rejected.", 400);
    }
    if (isFinalStatus(request.status)) {
        throw new FeaturedEventServiceError("This request has already been finalized.", 400);
    }
    request.status = "rejected";
    request.rejectionReason = data.rejectionReason;
    request.rejectedAt = new Date();
    request.isActive = false;
    request.paymentReservationExpiresAt = undefined;
    await request.save();
    return getPopulatedFeaturedRequest(request._id);
};

export const updateAdminFeaturedRequestService = async (requestId: string, data: UpdateFeaturedEventRequestInput) => {
    const requestObjectId = getObjectIdOrThrow(requestId, "featured request ID");
    return withFeaturedSlotMutationLock(async () => {
        const request = await getPopulatedFeaturedRequest(requestObjectId);
        if (request.status !== "approved") {
            throw new FeaturedEventServiceError("Only approved featured requests can be updated.", 400);
        }
        const event = getRequestEventOrThrow(request);
        const { startDate, endDate } = normalizePromotionPeriod(data.approvedStartDate ||
            request.approvedStartDate ||
            request.requestedStartDate, data.approvedEndDate ||
            request.approvedEndDate ||
            request.requestedEndDate, event, {
            allowPastStart: true,
        });
        await ensureFeaturedHomepageCapacity(request._id, startDate, endDate);
        request.approvedStartDate = startDate;
        request.approvedEndDate = endDate;
        if (data.adminNote !== undefined) {
            request.adminNote = data.adminNote;
        }
        if (data.isActive !== undefined) {
            request.isActive = data.isActive;
        }
        await request.save();
        await syncFeaturedEventRequestStates();
        return getPopulatedFeaturedRequest(request._id);
    });
};

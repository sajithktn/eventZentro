import crypto from "crypto";
import {
  isValidObjectId,
  QueryFilter,
  Types,
} from "mongoose";

import razorpay from "../config/razorpay";
import {
  IFeaturedEventRequest,
  IFeaturedEventSetting,
  FeaturedEventPaymentStatus,
  FeaturedEventRequestStatus,
} from "../interfaces/featuredEvent.interface";
import { IEvent } from "../interfaces/event.interface";
import { IUser } from "../interfaces/user.interface";
import Event from "../models/event.model";
import FeaturedEventRequest from "../models/featuredEventRequest.model";
import FeaturedEventSetting from "../models/featuredEventSetting.model";
import User from "../models/user.models";
import {
  buildPaginationMetadata,
  escapeRegExp,
  ParsedPaginationQuery,
} from "../utils/pagination";
import {
  getEventEndDateTime,
  getStartOfDay,
  hasEventEnded,
} from "../utils/eventLifecycle";
import {
  ApproveFeaturedEventRequestInput,
  CreateFeaturedEventRequestInput,
  RejectFeaturedEventRequestInput,
  UpdateFeaturedEventRequestInput,
  UpdateFeaturedEventSettingsInput,
  VerifyFeaturedEventPaymentInput,
} from "../validators/featuredEvent.validators";

const FEATURED_EVENT_SETTING_ID =
  "000000000000000000000101";

const DEFAULT_HOMEPAGE_LIMIT = 3;

const PAYMENT_RESERVATION_EXPIRY_HOURS = 24;

const finalRequestStatuses: FeaturedEventRequestStatus[] = [
  "rejected",
  "expired",
  "cancelled",
];

const requestStatuses: FeaturedEventRequestStatus[] = [
  "pending",
  "payment_pending",
  "paid",
  "approved",
  "rejected",
  "expired",
  "cancelled",
];

const paymentStatuses: FeaturedEventPaymentStatus[] = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
];

const defaultPaginationQuery: ParsedPaginationQuery = {
  page: 1,
  limit: 10,
  skip: 0,
};

interface FeaturedEventAdminQuery
  extends ParsedPaginationQuery {
  paymentStatus?: string;
  activeState?: string;
}

type PopulatedFeaturedEventRequest = Omit<
  IFeaturedEventRequest,
  "event" | "organizer" | "approvedBy"
> & {
  event?: IEvent | Types.ObjectId | null;
  organizer?: IUser | Types.ObjectId | null;
  approvedBy?: IUser | Types.ObjectId | null;
};

export class FeaturedEventServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "FeaturedEventServiceError";
    this.statusCode = statusCode;
  }
}

let featuredSlotMutationQueue: Promise<void> =
  Promise.resolve();

const withFeaturedSlotMutationLock = async <T>(
  operation: () => Promise<T>
) => {
  const previousQueue = featuredSlotMutationQueue;
  let releaseQueue: () => void = () => {};

  featuredSlotMutationQueue = new Promise<void>(
    (resolve) => {
      releaseQueue = resolve;
    }
  );

  await previousQueue;

  try {
    return await operation();
  } finally {
    releaseQueue();
  }
};

const requestPopulate = [
  {
    path: "event",
    select:
      "title description category city venue eventDate startTime endTime ticketPrice bannerImage status organizer isFeatured",
  },
  {
    path: "organizer",
    select: "firstName lastName email profileImage",
  },
  {
    path: "approvedBy",
    select: "firstName lastName email profileImage",
  },
];

const publicEventPopulate = {
  path: "event",
  match: {
    status: "published",
  },
  select:
    "title description category city venue eventDate startTime endTime ticketPrice totalTickets availableTickets bannerImage status organizer",
  populate: {
    path: "organizer",
    select: "firstName lastName email profileImage",
  },
};

const getObjectIdOrThrow = (
  value: string,
  label: string
) => {
  if (!isValidObjectId(value)) {
    throw new FeaturedEventServiceError(
      `Invalid ${label}.`,
      400
    );
  }

  return new Types.ObjectId(value);
};

const getReferenceIdString = (
  value:
    | string
    | Types.ObjectId
    | {
        _id?: string | Types.ObjectId | null;
      }
    | null
    | undefined,
  label: string
) => {
  if (!value) {
    throw new FeaturedEventServiceError(
      `${label} is missing.`,
      400
    );
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (!value._id) {
    throw new FeaturedEventServiceError(
      `${label} is missing.`,
      400
    );
  }

  return getReferenceIdString(value._id, label);
};

const isRequestStatus = (
  status: string
): status is FeaturedEventRequestStatus =>
  requestStatuses.includes(
    status as FeaturedEventRequestStatus
  );

const isPaymentStatus = (
  status: string
): status is FeaturedEventPaymentStatus =>
  paymentStatuses.includes(
    status as FeaturedEventPaymentStatus
  );

const isFinalStatus = (
  status: FeaturedEventRequestStatus
) => finalRequestStatuses.includes(status);

const normalizeDateAtStart = (value: string | Date) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new FeaturedEventServiceError(
      "Invalid promotion date.",
      400
    );
  }

  date.setHours(0, 0, 0, 0);

  return date;
};

const normalizeDateAtEnd = (value: string | Date) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new FeaturedEventServiceError(
      "Invalid promotion date.",
      400
    );
  }

  date.setHours(23, 59, 59, 999);

  return date;
};

const isSameCalendarDate = (
  first: Date,
  second: Date
) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const getEventEndOrThrow = (event: IEvent) => {
  const eventEndDate = getEventEndDateTime(
    event.eventDate,
    event.endTime
  );

  if (!eventEndDate) {
    throw new FeaturedEventServiceError(
      "Event end time is invalid.",
      400
    );
  }

  return eventEndDate;
};

const normalizePromotionPeriod = (
  startValue: string | Date,
  endValue: string | Date,
  event: IEvent,
  options: {
    allowPastStart?: boolean;
    now?: Date;
  } = {}
) => {
  const now = options.now || new Date();
  const todayStart = getStartOfDay(now);
  const eventEndDate = getEventEndOrThrow(event);

  let startDate = normalizeDateAtStart(startValue);
  let endDate = normalizeDateAtEnd(endValue);

  if (options.allowPastStart && startDate < todayStart) {
    startDate = todayStart;
  }

  if (!options.allowPastStart && startDate < todayStart) {
    throw new FeaturedEventServiceError(
      "Promotion start date cannot be in the past.",
      400
    );
  }

  if (
    isSameCalendarDate(endDate, eventEndDate) &&
    endDate > eventEndDate
  ) {
    endDate = eventEndDate;
  }

  if (endDate <= startDate) {
    throw new FeaturedEventServiceError(
      "Promotion end date must be later than start date.",
      400
    );
  }

  if (startDate > eventEndDate || endDate > eventEndDate) {
    throw new FeaturedEventServiceError(
      "Promotion dates cannot extend beyond the event lifecycle.",
      400
    );
  }

  if (endDate <= now) {
    throw new FeaturedEventServiceError(
      "Promotion end date must be in the future.",
      400
    );
  }

  return {
    startDate,
    endDate,
  };
};

const toRazorpayPaise = (amount: number) =>
  Math.round(amount * 100);

const getPaymentReservationExpiry = (
  now = new Date()
) =>
  new Date(
    now.getTime() +
      PAYMENT_RESERVATION_EXPIRY_HOURS *
        60 *
        60 *
        1000
  );

const signaturesMatch = (
  expectedSignature: string,
  receivedSignature: string
) => {
  const expectedBuffer = Buffer.from(
    expectedSignature,
    "hex"
  );

  const receivedBuffer = Buffer.from(
    receivedSignature,
    "hex"
  );

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    )
  );
};

const getFeaturedRequestSort = (
  sort?: string
): Record<string, 1 | -1> => {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };

    case "fee-high":
      return { promotionFee: -1 };

    case "fee-low":
      return { promotionFee: 1 };

    case "period":
      return { requestedStartDate: 1 };

    case "newest":
    default:
      return { createdAt: -1 };
  }
};

export const getFeaturedEventSettingsService =
  async (): Promise<IFeaturedEventSetting> => {
    const setting =
      await FeaturedEventSetting.findByIdAndUpdate(
        FEATURED_EVENT_SETTING_ID,
        {
          $setOnInsert: {
            promotionFee: 0,
            isPromotionEnabled: true,
            maximumFeaturedEventsOnHomepage:
              DEFAULT_HOMEPAGE_LIMIT,
            requirePaymentBeforeApproval: true,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    if (!setting) {
      throw new FeaturedEventServiceError(
        "Unable to load featured event settings.",
        500
      );
    }

    return setting;
  };

export const updateFeaturedEventSettingsService =
  async (
    data: UpdateFeaturedEventSettingsInput
  ): Promise<IFeaturedEventSetting> => {
    const setting =
      await getFeaturedEventSettingsService();

    setting.promotionFee = data.promotionFee;
    setting.isPromotionEnabled =
      data.isPromotionEnabled;
    setting.maximumFeaturedEventsOnHomepage =
      data.maximumFeaturedEventsOnHomepage;
    setting.requirePaymentBeforeApproval =
      data.requirePaymentBeforeApproval;
    setting.defaultPromotionDurationDays =
      data.defaultPromotionDurationDays;

    await setting.save();

    return setting;
  };

const getEventOwnedByOrganizerOrThrow = async (
  eventId: string,
  organizerId: string
) => {
  const eventObjectId = getObjectIdOrThrow(
    eventId,
    "event ID"
  );

  const event = await Event.findById(eventObjectId);

  if (!event) {
    throw new FeaturedEventServiceError(
      "Event not found.",
      404
    );
  }

  if (
    getReferenceIdString(
      event.organizer,
      "Organizer ID"
    ) !== organizerId
  ) {
    throw new FeaturedEventServiceError(
      "You can only request featured promotion for your own events.",
      403
    );
  }

  if (event.status !== "published") {
    throw new FeaturedEventServiceError(
      "Only published events can be featured.",
      400
    );
  }

  if (hasEventEnded(event.eventDate, event.endTime)) {
    throw new FeaturedEventServiceError(
      "Past or completed events cannot be featured.",
      400
    );
  }

  return event;
};

const getFeaturedRequestEventOrThrow = async (
  request: IFeaturedEventRequest
) => {
  const event = await Event.findById(request.event);

  if (!event) {
    throw new FeaturedEventServiceError(
      "Linked event was not found.",
      404
    );
  }

  if (event.status !== "published") {
    throw new FeaturedEventServiceError(
      "Only published events can be featured.",
      400
    );
  }

  if (hasEventEnded(event.eventDate, event.endTime)) {
    throw new FeaturedEventServiceError(
      "Past or completed events cannot be featured.",
      400
    );
  }

  return event;
};

const ensureNoOpenFeaturedRequest = async (
  eventId: Types.ObjectId | string,
  now = new Date(),
  excludeRequestId?: string | Types.ObjectId
) => {
  await syncFeaturedEventRequestStates(now);

  const filter: QueryFilter<IFeaturedEventRequest> = {
    event: eventId,
    status: {
      $in: [
        "pending",
        "payment_pending",
        "paid",
        "approved",
      ],
    },
  };

  if (excludeRequestId) {
    filter._id = {
      $ne: excludeRequestId,
    };
  }

  const existingRequests =
    await FeaturedEventRequest.find(filter).select(
      "_id status isActive approvedEndDate"
    );

  const hasOpenRequest = existingRequests.some(
    (request) => {
      if (
        request.status === "approved" &&
        (!request.isActive ||
          (request.approvedEndDate &&
            request.approvedEndDate < now))
      ) {
        return false;
      }

      return true;
    }
  );

  if (hasOpenRequest) {
    throw new FeaturedEventServiceError(
      "This event already has an active or pending featured promotion request.",
      409
    );
  }
};

const getPopulatedFeaturedRequest = async (
  requestId: string | Types.ObjectId
) => {
  const request =
    await FeaturedEventRequest.findById(requestId)
      .select("+razorpaySignature")
      .populate(requestPopulate);

  if (!request) {
    throw new FeaturedEventServiceError(
      "Featured event request not found.",
      404
    );
  }

  return request as PopulatedFeaturedEventRequest;
};

const createPaymentOrderForRequest = async (
  request: IFeaturedEventRequest
) => {
  const amount = toRazorpayPaise(
    request.promotionFee
  );

  const order = await razorpay.orders.create({
    amount,
    currency: request.currency,
    receipt: `featured_${request._id.toString()}`,
    notes: {
      requestId: request._id.toString(),
      eventId: request.event.toString(),
      organizerId: request.organizer.toString(),
    },
  });

  request.razorpayOrderId = order.id;
  request.paymentStatus = "pending";
  request.status = "payment_pending";

  await request.save();

  return order;
};

export const getEligibleFeaturedEventsForOrganizerService =
  async (organizerId: string) => {
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
      .select(
        "title category city venue eventDate startTime endTime ticketPrice bannerImage status organizer"
      );

    return events.filter(
      (event) =>
        !hasEventEnded(
          event.eventDate,
          event.endTime,
          now
        )
    );
  };

export const createFeaturedEventRequestService =
  async (
    organizerId: string,
    data: CreateFeaturedEventRequestInput
  ) => {
    const setting =
      await getFeaturedEventSettingsService();

    if (!setting.isPromotionEnabled) {
      throw new FeaturedEventServiceError(
        "Featured event promotion is currently disabled.",
        403
      );
    }

    const event =
      await getEventOwnedByOrganizerOrThrow(
        data.eventId,
        organizerId
      );

    await ensureNoOpenFeaturedRequest(
      event._id,
      new Date()
    );

    const { startDate, endDate } =
      normalizePromotionPeriod(
        data.requestedStartDate,
        data.requestedEndDate,
        event
      );

    const request =
      await FeaturedEventRequest.create({
        organizer: new Types.ObjectId(organizerId),
        event: event._id,
        promotionFee: setting.promotionFee,
        currency: "INR",
        requestedStartDate: startDate,
        requestedEndDate: endDate,
        status: "pending",
        paymentStatus:
          setting.promotionFee > 0 &&
          setting.requirePaymentBeforeApproval
            ? "unpaid"
            : "paid",
        paidAt:
          setting.promotionFee > 0 &&
          setting.requirePaymentBeforeApproval
            ? undefined
            : new Date(),
        isActive: false,
      });

    return {
      request:
        await getPopulatedFeaturedRequest(request._id),
      order: null,
      key: process.env.RAZORPAY_KEY_ID,
      paymentRequired: false,
    };
  };

export const createFeaturedEventPaymentOrderService =
  async (
    organizerId: string,
    requestId: string
  ) => {
    const requestObjectId =
      getObjectIdOrThrow(
        requestId,
        "featured request ID"
      );

    await syncFeaturedEventRequestStates();

    const request =
      await FeaturedEventRequest.findOne({
        _id: requestObjectId,
        organizer: organizerId,
      });

    if (!request) {
      throw new FeaturedEventServiceError(
        "Featured event request not found.",
        404
      );
    }

    if (isFinalStatus(request.status)) {
      throw new FeaturedEventServiceError(
        "Payment cannot be made for this request.",
        400
      );
    }

    if (request.status !== "payment_pending") {
      throw new FeaturedEventServiceError(
        "Admin approval and a reserved promotion period are required before payment.",
        400
      );
    }

    if (request.paymentStatus === "paid") {
      throw new FeaturedEventServiceError(
        "This featured promotion has already been paid.",
        400
      );
    }

    if (
      !request.approvedStartDate ||
      !request.approvedEndDate
    ) {
      throw new FeaturedEventServiceError(
        "Approved promotion dates are required before payment.",
        400
      );
    }

    if (request.promotionFee <= 0) {
      throw new FeaturedEventServiceError(
        "No payment is required for this featured promotion.",
        400
      );
    }

    const now = new Date();

    if (
      !request.paymentReservationExpiresAt ||
      request.paymentReservationExpiresAt <= now
    ) {
      request.status = "expired";
      request.isActive = false;
      await request.save();

      throw new FeaturedEventServiceError(
        "The reserved featured slot has expired. Please submit a new request.",
        410
      );
    }

    await getFeaturedRequestEventOrThrow(request);
    await ensureFeaturedHomepageCapacity(
      request._id,
      request.approvedStartDate,
      request.approvedEndDate
    );

    if (
      request.razorpayOrderId &&
      request.paymentStatus === "pending"
    ) {
      const existingOrder =
        await razorpay.orders.fetch(
          request.razorpayOrderId
        );

      if (
        Number(existingOrder.amount) ===
        toRazorpayPaise(request.promotionFee)
      ) {
        return {
          request:
            await getPopulatedFeaturedRequest(
              request._id
            ),
          order: existingOrder,
          amountToPay: request.promotionFee,
          key: process.env.RAZORPAY_KEY_ID,
        };
      }
    }

    const order =
      await createPaymentOrderForRequest(request);

    return {
      request:
        await getPopulatedFeaturedRequest(request._id),
      order,
      amountToPay: request.promotionFee,
      key: process.env.RAZORPAY_KEY_ID,
    };
  };

export const verifyFeaturedEventPaymentService =
  async (
    organizerId: string,
    data: VerifyFeaturedEventPaymentInput
  ) => {
    const requestObjectId =
      getObjectIdOrThrow(
        data.requestId,
        "featured request ID"
      );

    const request =
      await FeaturedEventRequest.findOne({
        _id: requestObjectId,
        organizer: organizerId,
      }).select("+razorpaySignature");

    if (!request) {
      throw new FeaturedEventServiceError(
        "Featured event request not found.",
        404
      );
    }

    if (request.paymentStatus === "paid") {
      return {
        success: true,
        request:
          await getPopulatedFeaturedRequest(
            request._id
          ),
        message:
          "Featured promotion payment is already verified.",
      };
    }

    if (isFinalStatus(request.status)) {
      throw new FeaturedEventServiceError(
        "Payment cannot be verified for this request.",
        400
      );
    }

    if (request.status !== "payment_pending") {
      throw new FeaturedEventServiceError(
        "Admin approval and a reserved promotion period are required before payment verification.",
        400
      );
    }

    if (
      !request.approvedStartDate ||
      !request.approvedEndDate
    ) {
      throw new FeaturedEventServiceError(
        "Approved promotion dates are required before payment verification.",
        400
      );
    }

    const verificationStartedAt = new Date();

    if (
      !request.paymentReservationExpiresAt ||
      request.paymentReservationExpiresAt <=
        verificationStartedAt
    ) {
      request.status = "expired";
      request.isActive = false;
      await request.save();

      throw new FeaturedEventServiceError(
        "The reserved featured slot has expired. Please submit a new request.",
        410
      );
    }

    if (!request.razorpayOrderId) {
      throw new FeaturedEventServiceError(
        "Razorpay order was not created for this featured request.",
        400
      );
    }

    if (
      request.razorpayOrderId !== data.razorpay_order_id
    ) {
      throw new FeaturedEventServiceError(
        "Razorpay order ID mismatch.",
        400
      );
    }

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new FeaturedEventServiceError(
        "Razorpay key secret is not configured.",
        500
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${request.razorpayOrderId}|${data.razorpay_payment_id}`
      )
      .digest("hex");

    if (
      !signaturesMatch(
        expectedSignature,
        data.razorpay_signature
      )
    ) {
      request.paymentStatus = "failed";
      await request.save();

      throw new FeaturedEventServiceError(
        "Invalid payment signature.",
        400
      );
    }

    const payment =
      await razorpay.payments.fetch(
        data.razorpay_payment_id
      );

    if (payment.order_id !== request.razorpayOrderId) {
      throw new FeaturedEventServiceError(
        "Payment does not belong to this featured promotion order.",
        400
      );
    }

    if (
      Number(payment.amount) !==
      toRazorpayPaise(request.promotionFee)
    ) {
      throw new FeaturedEventServiceError(
        "Payment amount does not match the featured promotion fee.",
        400
      );
    }

    if (payment.currency !== request.currency) {
      throw new FeaturedEventServiceError(
        "Invalid payment currency.",
        400
      );
    }

    if (payment.status !== "captured") {
      throw new FeaturedEventServiceError(
        "Payment has not been captured.",
        400
      );
    }

    const updatedRequest =
      await withFeaturedSlotMutationLock(async () => {
        const now = new Date();

        await syncFeaturedEventRequestStates(now);

        const latestRequest =
          await FeaturedEventRequest.findOne({
            _id: request._id,
            organizer: organizerId,
          }).select("+razorpaySignature");

        if (!latestRequest) {
          throw new FeaturedEventServiceError(
            "Featured event request not found.",
            404
          );
        }

        if (latestRequest.paymentStatus === "paid") {
          return latestRequest;
        }

        if (
          latestRequest.status !== "payment_pending" ||
          latestRequest.razorpayOrderId !==
            request.razorpayOrderId ||
          !latestRequest.approvedStartDate ||
          !latestRequest.approvedEndDate ||
          !latestRequest.paymentReservationExpiresAt ||
          latestRequest.paymentReservationExpiresAt <=
            now
        ) {
          if (
            latestRequest.status === "payment_pending"
          ) {
            latestRequest.status = "expired";
            latestRequest.isActive = false;
            await latestRequest.save();
          }

          throw new FeaturedEventServiceError(
            "Payment verification could not be completed because the reserved slot is no longer available.",
            409
          );
        }

        await getFeaturedRequestEventOrThrow(
          latestRequest
        );

        await ensureFeaturedHomepageCapacity(
          latestRequest._id,
          latestRequest.approvedStartDate,
          latestRequest.approvedEndDate
        );

        const finalizedRequest =
          await FeaturedEventRequest.findOneAndUpdate(
            {
              _id: latestRequest._id,
              organizer: organizerId,
              status: "payment_pending",
              paymentStatus: {
                $ne: "paid",
              },
              razorpayOrderId:
                latestRequest.razorpayOrderId,
              paymentReservationExpiresAt: {
                $gt: now,
              },
            },
            {
              $set: {
                razorpayPaymentId:
                  data.razorpay_payment_id,
                razorpaySignature:
                  data.razorpay_signature,
                paymentStatus: "paid",
                status: "approved",
                paidAt: now,
                isActive: true,
              },
              $unset: {
                paymentReservationExpiresAt: "",
              },
            },
            {
              new: true,
            }
          );

        if (!finalizedRequest) {
          const latestPaidRequest =
            await FeaturedEventRequest.findById(
              request._id
            );

          if (
            latestPaidRequest?.paymentStatus === "paid"
          ) {
            return latestPaidRequest;
          }

          throw new FeaturedEventServiceError(
            "Payment verification could not be completed.",
            400
          );
        }

        return finalizedRequest;
      });

    await syncFeaturedEventRequestStates();

    return {
      success: true,
      request:
        await getPopulatedFeaturedRequest(
          updatedRequest._id
        ),
      message:
        "Featured promotion payment verified successfully.",
    };
  };

export const getOrganizerFeaturedRequestsService =
  async (
    organizerId: string,
    query: ParsedPaginationQuery =
      defaultPaginationQuery
  ) => {
    await syncFeaturedEventRequestStates();

    const filter: QueryFilter<IFeaturedEventRequest> = {
      organizer: organizerId,
    };

    if (
      query.status &&
      query.status.toLowerCase() !== "all"
    ) {
      const normalizedStatus =
        query.status.toLowerCase();

      if (isRequestStatus(normalizedStatus)) {
        filter.status = normalizedStatus;
      }
    }

    if (query.search) {
      const searchRegex = new RegExp(
        escapeRegExp(query.search),
        "i"
      );

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
        $in: matchingEvents.map(
          (event) => event._id
        ),
      };
    }

    const [requests, totalItems] =
      await Promise.all([
        FeaturedEventRequest.find(filter)
          .populate(requestPopulate)
          .sort(getFeaturedRequestSort(query.sort))
          .skip(query.skip)
          .limit(query.limit),

        FeaturedEventRequest.countDocuments(filter),
      ]);

    return {
      success: true,
      message:
        "Featured event requests fetched successfully.",
      data: requests,
      requests,
      pagination: buildPaginationMetadata(
        query.page,
        query.limit,
        totalItems
      ),
    };
  };

export const cancelOrganizerFeaturedRequestService =
  async (
    organizerId: string,
    requestId: string
  ) => {
    const requestObjectId =
      getObjectIdOrThrow(
        requestId,
        "featured request ID"
      );

    const request =
      await FeaturedEventRequest.findOne({
        _id: requestObjectId,
        organizer: organizerId,
      });

    if (!request) {
      throw new FeaturedEventServiceError(
        "Featured event request not found.",
        404
      );
    }

    if (
      request.paymentStatus === "paid" ||
      request.status === "approved"
    ) {
      throw new FeaturedEventServiceError(
        "Paid or approved featured requests cannot be cancelled from this flow.",
        400
      );
    }

    if (
      request.status !== "pending" &&
      request.status !== "payment_pending"
    ) {
      throw new FeaturedEventServiceError(
        "This featured request cannot be cancelled.",
        400
      );
    }

    request.status = "cancelled";
    request.isActive = false;
    request.paymentReservationExpiresAt = undefined;

    await request.save();

    return {
      success: true,
      message:
        "Featured event request cancelled successfully.",
      request:
        await getPopulatedFeaturedRequest(request._id),
    };
  };

const getAdminSearchFilters = async (
  search: string
) => {
  const searchRegex = new RegExp(
    escapeRegExp(search),
    "i"
  );

  const [events, organizers] = await Promise.all([
    Event.find({
      $or: [
        { title: searchRegex },
        { category: searchRegex },
        { venue: searchRegex },
        { city: searchRegex },
      ],
    }).select("_id"),

    User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    }).select("_id"),
  ]);

  return {
    eventIds: events.map((event) => event._id),
    organizerIds: organizers.map(
      (organizer) => organizer._id
    ),
  };
};

const addFilterCondition = (
  filter: QueryFilter<IFeaturedEventRequest>,
  condition: QueryFilter<IFeaturedEventRequest>
) => {
  filter.$and = [
    ...(filter.$and || []),
    condition,
  ];
};

const buildAdminFeaturedRequestFilter = async (
  query: FeaturedEventAdminQuery
) => {
  const filter: QueryFilter<IFeaturedEventRequest> = {};

  if (
    query.status &&
    query.status.toLowerCase() !== "all"
  ) {
    const normalizedStatus =
      query.status.toLowerCase();

    if (isRequestStatus(normalizedStatus)) {
      filter.status = normalizedStatus;
    }
  }

  if (
    query.paymentStatus &&
    query.paymentStatus.toLowerCase() !== "all"
  ) {
    const normalizedPaymentStatus =
      query.paymentStatus.toLowerCase();

    if (isPaymentStatus(normalizedPaymentStatus)) {
      filter.paymentStatus = normalizedPaymentStatus;
    }
  }

  if (
    query.activeState &&
    query.activeState.toLowerCase() !== "all"
  ) {
    const state = query.activeState.toLowerCase();
    const now = new Date();

    if (state === "active") {
      filter.status = "approved";
      filter.isActive = true;
      filter.approvedStartDate = {
        $lte: now,
      };
      filter.approvedEndDate = {
        $gte: now,
      };
    }

    if (state === "inactive") {
      filter.isActive = false;
    }

    if (state === "expired") {
      addFilterCondition(filter, {
        $or: [
          { status: "expired" },
          {
            status: "approved",
            approvedEndDate: {
              $lt: now,
            },
          },
        ],
      });
    }
  }

  if (query.search) {
    const { eventIds, organizerIds } =
      await getAdminSearchFilters(query.search);

    const searchConditions:
      QueryFilter<IFeaturedEventRequest>[] = [
      ...(eventIds.length > 0
        ? [
            {
              event: {
                $in: eventIds,
              },
            },
          ]
        : []),
      ...(organizerIds.length > 0
        ? [
            {
              organizer: {
                $in: organizerIds,
              },
            },
          ]
        : []),
    ];

    if (searchConditions.length === 0) {
      filter._id = {
        $in: [],
      };
    } else {
      addFilterCondition(filter, {
        $or: searchConditions,
      });
    }
  }

  return filter;
};

export const getAdminFeaturedRequestsService =
  async (
    query: FeaturedEventAdminQuery =
      defaultPaginationQuery
  ) => {
    await syncFeaturedEventRequestStates();

    const filter =
      await buildAdminFeaturedRequestFilter(query);

    const [requests, totalItems] =
      await Promise.all([
        FeaturedEventRequest.find(filter)
          .populate(requestPopulate)
          .sort(getFeaturedRequestSort(query.sort))
          .skip(query.skip)
          .limit(query.limit),

        FeaturedEventRequest.countDocuments(filter),
      ]);

    return {
      success: true,
      message:
        "Admin featured event requests fetched successfully.",
      data: requests,
      requests,
      pagination: buildPaginationMetadata(
        query.page,
        query.limit,
        totalItems
      ),
    };
  };

const getRequestEventOrThrow = (
  request: PopulatedFeaturedEventRequest
) => {
  const event = request.event as IEvent | null;

  if (!event || event instanceof Types.ObjectId) {
    throw new FeaturedEventServiceError(
      "Linked event was not found.",
      404
    );
  }

  if (event.status !== "published") {
    throw new FeaturedEventServiceError(
      "Only published events can be approved for featuring.",
      400
    );
  }

  if (hasEventEnded(event.eventDate, event.endTime)) {
    throw new FeaturedEventServiceError(
      "Past or completed events cannot be featured.",
      400
    );
  }

  return event;
};

const ensureFeaturedHomepageCapacity = async (
  requestId: Types.ObjectId,
  startDate: Date,
  endDate: Date
) => {
  const now = new Date();
  const setting =
    await getFeaturedEventSettingsService();

  const reservedRequests =
    await FeaturedEventRequest.find({
      _id: {
        $ne: requestId,
      },
      $or: [
        {
          status: "approved",
          paymentStatus: "paid",
          isActive: true,
        },
        {
          status: "payment_pending",
          paymentReservationExpiresAt: {
            $gt: now,
          },
        },
      ],
    }).select(
      "approvedStartDate approvedEndDate requestedStartDate requestedEndDate"
    );

  const overlappingCount = reservedRequests.filter(
    (request) => {
      const approvedStartDate =
        request.approvedStartDate ||
        request.requestedStartDate;
      const approvedEndDate =
        request.approvedEndDate ||
        request.requestedEndDate;

      return (
        approvedStartDate <= endDate &&
        approvedEndDate >= startDate
      );
    }
  ).length;

  if (
    overlappingCount >=
    setting.maximumFeaturedEventsOnHomepage
  ) {
    throw new FeaturedEventServiceError(
      "The homepage featured-event limit is already reached for this date range.",
      409
    );
  }
};

export const approveFeaturedEventRequestService =
  async (
    adminId: string,
    requestId: string,
    data: ApproveFeaturedEventRequestInput
  ) => {
    const requestObjectId =
      getObjectIdOrThrow(
        requestId,
        "featured request ID"
      );

    return withFeaturedSlotMutationLock(async () => {
      await syncFeaturedEventRequestStates();

      const setting =
        await getFeaturedEventSettingsService();

      const request =
        await getPopulatedFeaturedRequest(
          requestObjectId
        );

      if (request.status === "approved") {
        throw new FeaturedEventServiceError(
          "This request is already approved.",
          400
        );
      }

      if (request.status === "payment_pending") {
        throw new FeaturedEventServiceError(
          "This request already has a reserved promotion slot awaiting payment.",
          400
        );
      }

      if (request.status !== "pending") {
        throw new FeaturedEventServiceError(
          "Only pending featured requests can be approved.",
          400
        );
      }

      if (isFinalStatus(request.status)) {
        throw new FeaturedEventServiceError(
          "This request cannot be approved.",
          400
        );
      }

      const event = getRequestEventOrThrow(request);

      const { startDate, endDate } =
        normalizePromotionPeriod(
          data.approvedStartDate ||
            request.requestedStartDate,
          data.approvedEndDate ||
            request.requestedEndDate,
          event,
          {
            allowPastStart: true,
          }
        );

      await ensureFeaturedHomepageCapacity(
        request._id,
        startDate,
        endDate
      );

      const now = new Date();
      const requiresPayment =
        setting.requirePaymentBeforeApproval &&
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

export const rejectFeaturedEventRequestService =
  async (
    _adminId: string,
    requestId: string,
    data: RejectFeaturedEventRequestInput
  ) => {
    const request =
      await FeaturedEventRequest.findById(
        getObjectIdOrThrow(
          requestId,
          "featured request ID"
        )
      );

    if (!request) {
      throw new FeaturedEventServiceError(
        "Featured event request not found.",
        404
      );
    }

    if (request.status === "approved") {
      throw new FeaturedEventServiceError(
        "Approved requests should be deactivated instead of rejected.",
        400
      );
    }

    if (isFinalStatus(request.status)) {
      throw new FeaturedEventServiceError(
        "This request has already been finalized.",
        400
      );
    }

    request.status = "rejected";
    request.rejectionReason = data.rejectionReason;
    request.rejectedAt = new Date();
    request.isActive = false;
    request.paymentReservationExpiresAt = undefined;

    await request.save();

    return getPopulatedFeaturedRequest(request._id);
  };

export const updateAdminFeaturedRequestService =
  async (
    requestId: string,
    data: UpdateFeaturedEventRequestInput
  ) => {
    const requestObjectId = getObjectIdOrThrow(
      requestId,
      "featured request ID"
    );

    return withFeaturedSlotMutationLock(async () => {
      const request =
        await getPopulatedFeaturedRequest(
          requestObjectId
        );

      if (request.status !== "approved") {
        throw new FeaturedEventServiceError(
          "Only approved featured requests can be updated.",
          400
        );
      }

      const event = getRequestEventOrThrow(request);

      const { startDate, endDate } =
        normalizePromotionPeriod(
          data.approvedStartDate ||
            request.approvedStartDate ||
            request.requestedStartDate,
          data.approvedEndDate ||
            request.approvedEndDate ||
            request.requestedEndDate,
          event,
          {
            allowPastStart: true,
          }
        );

      await ensureFeaturedHomepageCapacity(
        request._id,
        startDate,
        endDate
      );

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

export const deactivateFeaturedRequestsForEvent =
  async (
    eventId: string | Types.ObjectId,
    status: "cancelled" | "expired" = "expired"
  ) => {
    const eventObjectId =
      typeof eventId === "string"
        ? getObjectIdOrThrow(eventId, "event ID")
        : eventId;

    await FeaturedEventRequest.updateMany(
      {
        event: eventObjectId,
        status: {
          $in: [
            "pending",
            "payment_pending",
            "paid",
            "approved",
          ],
        },
      },
      {
        $set: {
          status,
          isActive: false,
        },
        $unset: {
          paymentReservationExpiresAt: "",
        },
      }
    );

    await Event.findByIdAndUpdate(eventObjectId, {
      $set: {
        isFeatured: false,
      },
    });
  };

export const syncFeaturedEventRequestStates =
  async (now = new Date()) => {
    const expiredReservationRequests =
      await FeaturedEventRequest.find({
        status: "payment_pending",
        paymentReservationExpiresAt: {
          $lte: now,
        },
      }).select("_id");

    if (expiredReservationRequests.length > 0) {
      await FeaturedEventRequest.updateMany(
        {
          _id: {
            $in: expiredReservationRequests.map(
              (request) => request._id
            ),
          },
        },
        {
          $set: {
            status: "expired",
            isActive: false,
          },
        }
      );
    }

    const expiredApprovedRequests =
      await FeaturedEventRequest.find({
        status: "approved",
        approvedEndDate: {
          $lt: now,
        },
      }).select("_id");

    if (expiredApprovedRequests.length > 0) {
      await FeaturedEventRequest.updateMany(
        {
          _id: {
            $in: expiredApprovedRequests.map(
              (request) => request._id
            ),
          },
        },
        {
          $set: {
            status: "expired",
            isActive: false,
          },
        }
      );
    }

    const candidateRequests =
      await FeaturedEventRequest.find({
        status: "approved",
        paymentStatus: "paid",
        isActive: true,
      }).populate(publicEventPopulate);

    const expiredRequestIds: Types.ObjectId[] = [];
    const activeEventIds: Types.ObjectId[] = [];

    candidateRequests.forEach((request) => {
      const event =
        request.event as unknown as
          | IEvent
          | Types.ObjectId
          | null
          | undefined;
      const approvedStartDate =
        request.approvedStartDate ||
        request.requestedStartDate;
      const approvedEndDate =
        request.approvedEndDate ||
        request.requestedEndDate;

      if (
        !event ||
        event instanceof Types.ObjectId ||
        approvedEndDate < now ||
        event.status !== "published" ||
        hasEventEnded(event.eventDate, event.endTime, now)
      ) {
        expiredRequestIds.push(request._id);
        return;
      }

      if (approvedStartDate <= now) {
        activeEventIds.push(
          event._id as Types.ObjectId
        );
      }
    });

    if (expiredRequestIds.length > 0) {
      await FeaturedEventRequest.updateMany(
        {
          _id: {
            $in: expiredRequestIds,
          },
        },
        {
          $set: {
            status: "expired",
            isActive: false,
          },
        }
      );
    }

    await Event.updateMany(
      {
        isFeatured: true,
        _id: {
          $nin: activeEventIds,
        },
      },
      {
        $set: {
          isFeatured: false,
        },
      }
    );

    if (activeEventIds.length > 0) {
      await Event.updateMany(
        {
          _id: {
            $in: activeEventIds,
          },
          status: "published",
        },
        {
          $set: {
            isFeatured: true,
          },
        }
      );
    }

    return {
      expiredCount:
        expiredReservationRequests.length +
        expiredRequestIds.length +
        expiredApprovedRequests.length,
      activeCount: activeEventIds.length,
    };
  };

export const getPublicFeaturedEventsService =
  async () => {
    await syncFeaturedEventRequestStates();

    const setting =
      await getFeaturedEventSettingsService();

    const now = new Date();

    const requests =
      await FeaturedEventRequest.find({
        status: "approved",
        paymentStatus: "paid",
        isActive: true,
        approvedStartDate: {
          $lte: now,
        },
        approvedEndDate: {
          $gte: now,
        },
      })
        .populate(publicEventPopulate)
        .sort({
          approvedStartDate: 1,
          approvedAt: -1,
        });

    const events = requests
      .map(
        (request) =>
          request.event as unknown as
            | IEvent
            | Types.ObjectId
            | null
      )
      .filter((event): event is IEvent => {
        if (!event || event instanceof Types.ObjectId) {
          return false;
        }

        return (
          event.status === "published" &&
          event.eventDate >= getStartOfDay(now) &&
          !hasEventEnded(
            event.eventDate,
            event.endTime,
            now
          )
        );
      })
      .slice(
        0,
        setting.maximumFeaturedEventsOnHomepage ||
          DEFAULT_HOMEPAGE_LIMIT
      );

    return {
      success: true,
      message:
        "Featured events fetched successfully.",
      count: events.length,
      data: events,
      events,
      limit:
        setting.maximumFeaturedEventsOnHomepage ||
        DEFAULT_HOMEPAGE_LIMIT,
    };
  };

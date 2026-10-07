import { Types } from "mongoose";
import { IEvent } from "../event/event.interface";
import Event from "../event/event.model";
import FeaturedEventRequest from "./featured-event-request.model";
import { hasEventEnded } from "../../utils/eventLifecycle";

import { publicEventPopulate } from "./constants";
import { getObjectIdOrThrow } from "./helpers";

export const deactivateFeaturedRequestsForEvent = async (eventId: string | Types.ObjectId, status: "cancelled" | "expired" = "expired") => {
    const eventObjectId = typeof eventId === "string"
        ? getObjectIdOrThrow(eventId, "event ID")
        : eventId;
    await FeaturedEventRequest.updateMany({
        event: eventObjectId,
        status: {
            $in: [
                "pending",
                "payment_pending",
                "paid",
                "approved",
            ],
        },
    }, {
        $set: {
            status,
            isActive: false,
        },
        $unset: {
            paymentReservationExpiresAt: "",
        },
    });
    await Event.findByIdAndUpdate(eventObjectId, {
        $set: {
            isFeatured: false,
        },
    });
};

export const syncFeaturedEventRequestStates = async (now = new Date()) => {
    const expiredReservationRequests = await FeaturedEventRequest.find({
        status: "payment_pending",
        paymentReservationExpiresAt: {
            $lte: now,
        },
    }).select("_id");
    if (expiredReservationRequests.length > 0) {
        await FeaturedEventRequest.updateMany({
            _id: {
                $in: expiredReservationRequests.map((request) => request._id),
            },
        }, {
            $set: {
                status: "expired",
                isActive: false,
            },
        });
    }
    const expiredApprovedRequests = await FeaturedEventRequest.find({
        status: "approved",
        approvedEndDate: {
            $lt: now,
        },
    }).select("_id");
    if (expiredApprovedRequests.length > 0) {
        await FeaturedEventRequest.updateMany({
            _id: {
                $in: expiredApprovedRequests.map((request) => request._id),
            },
        }, {
            $set: {
                status: "expired",
                isActive: false,
            },
        });
    }
    const candidateRequests = await FeaturedEventRequest.find({
        status: "approved",
        paymentStatus: "paid",
        isActive: true,
    }).populate(publicEventPopulate);
    const expiredRequestIds: Types.ObjectId[] = [];
    const activeEventIds: Types.ObjectId[] = [];
    candidateRequests.forEach((request) => {
        const event = request.event as unknown as IEvent | Types.ObjectId | null | undefined;
        const approvedStartDate = request.approvedStartDate ||
            request.requestedStartDate;
        const approvedEndDate = request.approvedEndDate ||
            request.requestedEndDate;
        if (!event ||
            event instanceof Types.ObjectId ||
            approvedEndDate < now ||
            event.status !== "published" ||
            hasEventEnded(event.eventDate, event.endTime, now)) {
            expiredRequestIds.push(request._id);
            return;
        }
        if (approvedStartDate <= now) {
            activeEventIds.push(event._id as Types.ObjectId);
        }
    });
    if (expiredRequestIds.length > 0) {
        await FeaturedEventRequest.updateMany({
            _id: {
                $in: expiredRequestIds,
            },
        }, {
            $set: {
                status: "expired",
                isActive: false,
            },
        });
    }
    await Event.updateMany({
        isFeatured: true,
        _id: {
            $nin: activeEventIds,
        },
    }, {
        $set: {
            isFeatured: false,
        },
    });
    if (activeEventIds.length > 0) {
        await Event.updateMany({
            _id: {
                $in: activeEventIds,
            },
            status: "published",
        }, {
            $set: {
                isFeatured: true,
            },
        });
    }
    return {
        expiredCount: expiredReservationRequests.length +
            expiredRequestIds.length +
            expiredApprovedRequests.length,
        activeCount: activeEventIds.length,
    };
};

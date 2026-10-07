import { Types } from "mongoose";
import { IEvent } from "../event/event.interface";
import FeaturedEventRequest from "./featured-event-request.model";
import { getStartOfDay, hasEventEnded } from "../../utils/eventLifecycle";

import { DEFAULT_HOMEPAGE_LIMIT, publicEventPopulate } from "./constants";
import { syncFeaturedEventRequestStates } from "./lifecycle.service";
import { getFeaturedEventSettingsService } from "./settings.service";

export const getPublicFeaturedEventsService = async () => {
    await syncFeaturedEventRequestStates();
    const setting = await getFeaturedEventSettingsService();
    const now = new Date();
    const requests = await FeaturedEventRequest.find({
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
        .map((request) => request.event as unknown as IEvent | Types.ObjectId | null)
        .filter((event): event is IEvent => {
        if (!event || event instanceof Types.ObjectId) {
            return false;
        }
        return (event.status === "published" &&
            event.eventDate >= getStartOfDay(now) &&
            !hasEventEnded(event.eventDate, event.endTime, now));
    })
        .slice(0, setting.maximumFeaturedEventsOnHomepage ||
        DEFAULT_HOMEPAGE_LIMIT);
    return {
        success: true,
        message: "Featured events fetched successfully.",
        count: events.length,
        data: events,
        events,
        limit: setting.maximumFeaturedEventsOnHomepage ||
            DEFAULT_HOMEPAGE_LIMIT,
    };
};

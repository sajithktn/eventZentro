import { QueryFilter, Types } from "mongoose";
import { IFeaturedEventRequest } from "./featured-event.interface";
import { IEvent } from "../event/event.interface";
import Event from "../event/event.model";
import FeaturedEventRequest from "./featured-event-request.model";
import User from "../user/user.model";
import { escapeRegExp } from "../../utils/pagination";
import { hasEventEnded } from "../../utils/eventLifecycle";

import { isPaymentStatus, isRequestStatus } from "./helpers";
import { getFeaturedEventSettingsService } from "./settings.service";
import { FeaturedEventAdminQuery, FeaturedEventServiceError, PopulatedFeaturedEventRequest } from "./types";

export const getAdminSearchFilters = async (search: string) => {
    const searchRegex = new RegExp(escapeRegExp(search), "i");
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
        organizerIds: organizers.map((organizer) => organizer._id),
    };
};

export const addFilterCondition = (filter: QueryFilter<IFeaturedEventRequest>, condition: QueryFilter<IFeaturedEventRequest>) => {
    filter.$and = [
        ...(filter.$and || []),
        condition,
    ];
};

export const buildAdminFeaturedRequestFilter = async (query: FeaturedEventAdminQuery) => {
    const filter: QueryFilter<IFeaturedEventRequest> = {};
    if (query.status &&
        query.status.toLowerCase() !== "all") {
        const normalizedStatus = query.status.toLowerCase();
        if (isRequestStatus(normalizedStatus)) {
            filter.status = normalizedStatus;
        }
    }
    if (query.paymentStatus &&
        query.paymentStatus.toLowerCase() !== "all") {
        const normalizedPaymentStatus = query.paymentStatus.toLowerCase();
        if (isPaymentStatus(normalizedPaymentStatus)) {
            filter.paymentStatus = normalizedPaymentStatus;
        }
    }
    if (query.activeState &&
        query.activeState.toLowerCase() !== "all") {
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
        const { eventIds, organizerIds } = await getAdminSearchFilters(query.search);
        const searchConditions: QueryFilter<IFeaturedEventRequest>[] = [
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
        }
        else {
            addFilterCondition(filter, {
                $or: searchConditions,
            });
        }
    }
    return filter;
};

export const getRequestEventOrThrow = (request: PopulatedFeaturedEventRequest) => {
    const event = request.event as IEvent | null;
    if (!event || event instanceof Types.ObjectId) {
        throw new FeaturedEventServiceError("Linked event was not found.", 404);
    }
    if (event.status !== "published") {
        throw new FeaturedEventServiceError("Only published events can be approved for featuring.", 400);
    }
    if (hasEventEnded(event.eventDate, event.endTime)) {
        throw new FeaturedEventServiceError("Past or completed events cannot be featured.", 400);
    }
    return event;
};

export const ensureFeaturedHomepageCapacity = async (requestId: Types.ObjectId, startDate: Date, endDate: Date) => {
    const now = new Date();
    const setting = await getFeaturedEventSettingsService();
    const reservedRequests = await FeaturedEventRequest.find({
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
    }).select("approvedStartDate approvedEndDate requestedStartDate requestedEndDate");
    const overlappingCount = reservedRequests.filter((request) => {
        const approvedStartDate = request.approvedStartDate ||
            request.requestedStartDate;
        const approvedEndDate = request.approvedEndDate ||
            request.requestedEndDate;
        return (approvedStartDate <= endDate &&
            approvedEndDate >= startDate);
    }).length;
    if (overlappingCount >=
        setting.maximumFeaturedEventsOnHomepage) {
        throw new FeaturedEventServiceError("The homepage featured-event limit is already reached for this date range.", 409);
    }
};

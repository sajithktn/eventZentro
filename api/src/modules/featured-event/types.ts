import { Types } from "mongoose";
import { IFeaturedEventRequest } from "./featured-event.interface";
import { IEvent } from "../event/event.interface";
import { IUser } from "../user/user.interface";
import { ParsedPaginationQuery } from "../../utils/pagination";

export interface FeaturedEventAdminQuery extends ParsedPaginationQuery {
    paymentStatus?: string;
    activeState?: string;
}

export type PopulatedFeaturedEventRequest = Omit<IFeaturedEventRequest, "event" | "organizer" | "approvedBy"> & {
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

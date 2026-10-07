import { IEvent } from "./event.interface";
import { ParsedPaginationQuery } from "../../utils/pagination";

export interface GetAllEventsServiceOptions {
    query: ParsedPaginationQuery;
    organizerId?: string;
    includeAllOrganizers?: boolean;
    onlyUpcoming?: boolean;
}

export type EventResponse = IEvent & {
    bestPromotion?: IEvent["bestPromotion"];
};

export class EventServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 400) {
        super(message);
        this.name = "EventServiceError";
        this.statusCode = statusCode;
    }
}

export type SortDirection = 1 | -1;

export type EventSort = Record<string, SortDirection>;

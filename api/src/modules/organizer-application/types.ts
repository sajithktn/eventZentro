import { ParsedPaginationQuery } from "../../utils/pagination";

export interface AdminOrganizerApplicationsQuery extends ParsedPaginationQuery {
    status?: string;
}

export interface DuplicateKeyError {
    code?: number;
}

export class OrganizerApplicationServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 400) {
        super(message);
        this.name = "OrganizerApplicationServiceError";
        this.statusCode = statusCode;
    }
}

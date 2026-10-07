import { isValidObjectId, QueryFilter, Types } from "mongoose";
import { IOrganizerApplication, OrganizerApplicationStatus } from "./organizer-application.interface";
import OrganizerApplication from "./organizer-application.model";
import User from "../user/user.model";
import { CreateOrganizerApplicationInput } from "./organizer-application.validation";
import { escapeRegExp } from "../../utils/pagination";

import { AdminOrganizerApplicationsQuery, DuplicateKeyError, OrganizerApplicationServiceError } from "./types";

export const applicationPopulate = [
    {
        path: "user",
        select: "firstName lastName email profileImage role isBlocked isDeleted createdAt updatedAt",
    },
    {
        path: "reviewedBy",
        select: "firstName lastName email profileImage role",
    },
];

export const adminApplicationUserFields = [
    "firstName",
    "lastName",
    "email",
    "profileImage",
    "bio",
    "role",
    "provider",
    "isVerified",
    "isBlocked",
    "isDeleted",
    "address",
    "organizerName",
    "companyName",
    "organizerCategory",
    "website",
    "instagram",
    "facebook",
    "linkedin",
    "twitter",
    "socialLinks",
    "createdAt",
    "updatedAt",
].join(" ");

export const organizerApplicationStatuses: OrganizerApplicationStatus[] = ["pending", "approved", "rejected"];

export const isDuplicateKeyError = (error: unknown): error is DuplicateKeyError => {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as DuplicateKeyError).code === 11000);
};

export const isOrganizerApplicationStatus = (status: string): status is OrganizerApplicationStatus => {
    return organizerApplicationStatuses.includes(status as OrganizerApplicationStatus);
};

export const getObjectIdOrThrow = (value: string, label: string) => {
    if (!isValidObjectId(value)) {
        throw new OrganizerApplicationServiceError(`Invalid ${label}.`, 400);
    }
    return new Types.ObjectId(value);
};

export const buildPagination = (page: number, limit: number, totalItems: number) => {
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
    return {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
};

export const getOptionalString = (value?: string) => {
    return value?.trim() || "";
};

export const buildApplicationData = (data: CreateOrganizerApplicationInput) => {
    return {
        organizerName: data.organizerName,
        category: data.category,
        description: data.description,
        phone: data.phone,
        location: data.location,
        website: getOptionalString(data.website),
        instagram: getOptionalString(data.instagram),
        linkedin: getOptionalString(data.linkedin),
        profileImage: getOptionalString(data.profileImage),
    };
};

export const buildAdminApplicationFilter = async (query: AdminOrganizerApplicationsQuery) => {
    const filter: QueryFilter<IOrganizerApplication> = {};
    if (query.status &&
        query.status !== "all") {
        if (!isOrganizerApplicationStatus(query.status)) {
            throw new OrganizerApplicationServiceError("Application status must be pending, approved or rejected.", 400);
        }
        filter.status = query.status;
    }
    if (query.search) {
        const searchRegex = new RegExp(escapeRegExp(query.search.trim()), "i");
        const matchingUsers = await User.find({
            $or: [
                {
                    firstName: searchRegex,
                },
                {
                    lastName: searchRegex,
                },
                {
                    email: searchRegex,
                },
            ],
        }).select("_id");
        const userIds = matchingUsers.map((user) => user._id);
        filter.$or = [
            {
                organizerName: searchRegex,
            },
            {
                category: searchRegex,
            },
            {
                location: searchRegex,
            },
            ...(userIds.length > 0
                ? [
                    {
                        user: {
                            $in: userIds,
                        },
                    },
                ]
                : []),
        ];
    }
    return filter;
};

export const getPopulatedAdminApplication = async (applicationId: string | Types.ObjectId) => {
    const application = await OrganizerApplication.findById(applicationId).populate(applicationPopulate);
    if (!application) {
        throw new OrganizerApplicationServiceError("Organizer application not found.", 404);
    }
    return application;
};

export const getApplicationByIdOrThrow = async (applicationId: string) => {
    const applicationObjectId = getObjectIdOrThrow(applicationId, "application ID");
    const application = await OrganizerApplication.findById(applicationObjectId);
    if (!application) {
        throw new OrganizerApplicationServiceError("Organizer application not found.", 404);
    }
    return application;
};

export const ensurePendingApplication = (application: IOrganizerApplication) => {
    if (application.status === "approved") {
        throw new OrganizerApplicationServiceError("This organizer application has already been approved.", 409);
    }
    if (application.status === "rejected") {
        throw new OrganizerApplicationServiceError("This organizer application has already been rejected.", 409);
    }
    if (application.status !== "pending") {
        throw new OrganizerApplicationServiceError("Only pending organizer applications can be processed.", 409);
    }
};

export const rollbackApprovedApplication = async (applicationId: Types.ObjectId, adminId: Types.ObjectId) => {
    await OrganizerApplication.updateOne({
        _id: applicationId,
        status: "approved",
        reviewedBy: adminId,
    }, {
        $set: {
            status: "pending",
            rejectionReason: "",
        },
        $unset: {
            reviewedBy: "",
            reviewedAt: "",
        },
    });
};

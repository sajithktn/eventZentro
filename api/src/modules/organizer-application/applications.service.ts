import { IUser, UserRole } from "../user/user.interface";
import OrganizerApplication from "./organizer-application.model";
import User from "../user/user.model";
import { CreateOrganizerApplicationInput, RejectOrganizerApplicationInput } from "./organizer-application.validation";

import { adminApplicationUserFields, applicationPopulate, buildAdminApplicationFilter, buildApplicationData, buildPagination, ensurePendingApplication, getApplicationByIdOrThrow, getObjectIdOrThrow, getOptionalString, getPopulatedAdminApplication, isDuplicateKeyError, rollbackApprovedApplication } from "./helpers";
import { AdminOrganizerApplicationsQuery, OrganizerApplicationServiceError } from "./types";

export const submitOrganizerApplicationService = async (data: CreateOrganizerApplicationInput, user: IUser) => {
    if (user.role === UserRole.ORGANIZER ||
        user.role === UserRole.ADMIN) {
        throw new Error("Only normal users can submit organizer applications.");
    }
    const applicationData = buildApplicationData(data);
    const existingApplication = await OrganizerApplication.findOne({
        user: user._id,
    });
    if (existingApplication?.status === "pending") {
        throw new Error("You already have a pending organizer application.");
    }
    if (existingApplication?.status === "approved") {
        throw new Error("You already have an approved organizer application.");
    }
    if (existingApplication?.status === "rejected") {
        existingApplication.set({
            ...applicationData,
            status: "pending",
            rejectionReason: "",
            reviewedBy: undefined,
            reviewedAt: undefined,
        });
        const application = await existingApplication.save();
        return {
            message: "Organizer application submitted successfully.",
            application,
        };
    }
    try {
        const application = await OrganizerApplication.create({
            user: user._id,
            ...applicationData,
            status: "pending",
        });
        return {
            message: "Organizer application submitted successfully.",
            application,
        };
    }
    catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new Error("You already have an organizer application.");
        }
        throw error;
    }
};

export const getMyOrganizerApplicationService = async (userId: string) => {
    return OrganizerApplication.findOne({
        user: userId,
    }).select("-rejectionReason -reviewedBy -reviewedAt");
};

export const getAdminOrganizerApplicationsService = async (query: AdminOrganizerApplicationsQuery) => {
    const filter = await buildAdminApplicationFilter(query);
    const [applications, totalItems] = await Promise.all([
        OrganizerApplication.find(filter)
            .populate(applicationPopulate)
            .sort({
            createdAt: -1,
        })
            .skip(query.skip)
            .limit(query.limit),
        OrganizerApplication.countDocuments(filter),
    ]);
    return {
        success: true,
        message: "Organizer applications fetched successfully.",
        data: applications,
        applications,
        pagination: buildPagination(query.page, query.limit, totalItems),
    };
};

export const getAdminOrganizerApplicationByIdService = async (applicationId: string) => {
    getObjectIdOrThrow(applicationId, "application ID");
    const application = await getPopulatedAdminApplication(applicationId);
    return {
        success: true,
        message: "Organizer application fetched successfully.",
        application,
    };
};

export const approveOrganizerApplicationService = async (applicationId: string, adminId: string) => {
    const adminObjectId = getObjectIdOrThrow(adminId, "admin ID");
    const application = await getApplicationByIdOrThrow(applicationId);
    ensurePendingApplication(application);
    const applicant = await User.findOne({
        _id: application.user,
        isDeleted: false,
    });
    if (!applicant) {
        throw new OrganizerApplicationServiceError("The applicant user account no longer exists.", 404);
    }
    if (applicant.role !== UserRole.USER) {
        throw new OrganizerApplicationServiceError("Only normal user applications can be approved.", 409);
    }
    const reviewedAt = new Date();
    const updatedApplication = await OrganizerApplication.findOneAndUpdate({
        _id: application._id,
        status: "pending",
    }, {
        $set: {
            status: "approved",
            rejectionReason: "",
            reviewedBy: adminObjectId,
            reviewedAt,
        },
    }, {
        returnDocument: "after",
    });
    if (!updatedApplication) {
        throw new OrganizerApplicationServiceError("This organizer application has already been processed.", 409);
    }
    try {
        const updatedUser = await User.findOneAndUpdate({
            _id: applicant._id,
            isDeleted: false,
            role: UserRole.USER,
        }, {
            $set: {
                role: UserRole.ORGANIZER,
            },
        }, {
            returnDocument: "after",
            runValidators: true,
        }).select(adminApplicationUserFields);
        if (!updatedUser) {
            throw new OrganizerApplicationServiceError("The applicant user could not be promoted to organizer.", 409);
        }
        return {
            success: true,
            message: "Organizer application approved successfully.",
            application: await getPopulatedAdminApplication(updatedApplication._id),
            user: updatedUser,
        };
    }
    catch (error) {
        await rollbackApprovedApplication(updatedApplication._id, adminObjectId);
        throw error;
    }
};

export const rejectOrganizerApplicationService = async (applicationId: string, adminId: string, data: RejectOrganizerApplicationInput) => {
    const adminObjectId = getObjectIdOrThrow(adminId, "admin ID");
    const application = await getApplicationByIdOrThrow(applicationId);
    ensurePendingApplication(application);
    const updatedApplication = await OrganizerApplication.findOneAndUpdate({
        _id: application._id,
        status: "pending",
    }, {
        $set: {
            status: "rejected",
            rejectionReason: getOptionalString(data.rejectionReason),
            reviewedBy: adminObjectId,
            reviewedAt: new Date(),
        },
    }, {
        returnDocument: "after",
    });
    if (!updatedApplication) {
        throw new OrganizerApplicationServiceError("This organizer application has already been processed.", 409);
    }
    return {
        success: true,
        message: "Organizer application rejected successfully.",
        application: await getPopulatedAdminApplication(updatedApplication._id),
    };
};

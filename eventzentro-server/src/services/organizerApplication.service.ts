import {
  isValidObjectId,
  QueryFilter,
  Types,
} from "mongoose";

import {
  IOrganizerApplication,
  OrganizerApplicationStatus,
} from "../interfaces/organizerApplication.interface";
import { IUser, UserRole } from "../interfaces/user.interface";
import OrganizerApplication from "../models/organizerApplication.model";
import User from "../models/user.models";
import {
  CreateOrganizerApplicationInput,
  RejectOrganizerApplicationInput,
} from "../validators/organizerApplication.validator";
import {
  escapeRegExp,
  ParsedPaginationQuery,
} from "../utils/pagination";

interface AdminOrganizerApplicationsQuery
  extends ParsedPaginationQuery {
  status?: string;
}

interface DuplicateKeyError {
  code?: number;
}

const applicationPopulate = [
  {
    path: "user",
    select:
      "firstName lastName email profileImage role isBlocked isDeleted createdAt updatedAt",
  },
  {
    path: "reviewedBy",
    select: "firstName lastName email profileImage role",
  },
];

const adminApplicationUserFields = [
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

const organizerApplicationStatuses: OrganizerApplicationStatus[] =
  ["pending", "approved", "rejected"];

export class OrganizerApplicationServiceError extends Error {
  statusCode: number;

  constructor(
    message: string,
    statusCode = 400
  ) {
    super(message);
    this.name = "OrganizerApplicationServiceError";
    this.statusCode = statusCode;
  }
}

const isDuplicateKeyError = (
  error: unknown
): error is DuplicateKeyError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as DuplicateKeyError).code === 11000
  );
};

const isOrganizerApplicationStatus = (
  status: string
): status is OrganizerApplicationStatus => {
  return organizerApplicationStatuses.includes(
    status as OrganizerApplicationStatus
  );
};

const getObjectIdOrThrow = (
  value: string,
  label: string
) => {
  if (!isValidObjectId(value)) {
    throw new OrganizerApplicationServiceError(
      `Invalid ${label}.`,
      400
    );
  }

  return new Types.ObjectId(value);
};

const buildPagination = (
  page: number,
  limit: number,
  totalItems: number
) => {
  const totalPages = Math.max(
    Math.ceil(totalItems / limit),
    1
  );

  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

const getOptionalString = (value?: string) => {
  return value?.trim() || "";
};

const buildApplicationData = (
  data: CreateOrganizerApplicationInput
) => {
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

const buildAdminApplicationFilter = async (
  query: AdminOrganizerApplicationsQuery
) => {
  const filter: QueryFilter<IOrganizerApplication> =
    {};

  if (
    query.status &&
    query.status !== "all"
  ) {
    if (!isOrganizerApplicationStatus(query.status)) {
      throw new OrganizerApplicationServiceError(
        "Application status must be pending, approved or rejected.",
        400
      );
    }

    filter.status = query.status;
  }

  if (query.search) {
    const searchRegex = new RegExp(
      escapeRegExp(query.search.trim()),
      "i"
    );

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

    const userIds = matchingUsers.map(
      (user) => user._id
    );

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

const getPopulatedAdminApplication = async (
  applicationId: string | Types.ObjectId
) => {
  const application =
    await OrganizerApplication.findById(
      applicationId
    ).populate(applicationPopulate);

  if (!application) {
    throw new OrganizerApplicationServiceError(
      "Organizer application not found.",
      404
    );
  }

  return application;
};

const getApplicationByIdOrThrow = async (
  applicationId: string
) => {
  const applicationObjectId =
    getObjectIdOrThrow(
      applicationId,
      "application ID"
    );

  const application =
    await OrganizerApplication.findById(
      applicationObjectId
    );

  if (!application) {
    throw new OrganizerApplicationServiceError(
      "Organizer application not found.",
      404
    );
  }

  return application;
};

const ensurePendingApplication = (
  application: IOrganizerApplication
) => {
  if (application.status === "approved") {
    throw new OrganizerApplicationServiceError(
      "This organizer application has already been approved.",
      409
    );
  }

  if (application.status === "rejected") {
    throw new OrganizerApplicationServiceError(
      "This organizer application has already been rejected.",
      409
    );
  }

  if (application.status !== "pending") {
    throw new OrganizerApplicationServiceError(
      "Only pending organizer applications can be processed.",
      409
    );
  }
};

const rollbackApprovedApplication = async (
  applicationId: Types.ObjectId,
  adminId: Types.ObjectId
) => {
  await OrganizerApplication.updateOne(
    {
      _id: applicationId,
      status: "approved",
      reviewedBy: adminId,
    },
    {
      $set: {
        status: "pending",
        rejectionReason: "",
      },
      $unset: {
        reviewedBy: "",
        reviewedAt: "",
      },
    }
  );
};

export const submitOrganizerApplicationService =
  async (
    data: CreateOrganizerApplicationInput,
    user: IUser
  ) => {
    if (
      user.role === UserRole.ORGANIZER ||
      user.role === UserRole.ADMIN
    ) {
      throw new Error(
        "Only normal users can submit organizer applications."
      );
    }

    const applicationData =
      buildApplicationData(data);

    const existingApplication =
      await OrganizerApplication.findOne({
        user: user._id,
      });

    if (
      existingApplication?.status === "pending"
    ) {
      throw new Error(
        "You already have a pending organizer application."
      );
    }

    if (
      existingApplication?.status === "approved"
    ) {
      throw new Error(
        "You already have an approved organizer application."
      );
    }

    if (
      existingApplication?.status === "rejected"
    ) {
      existingApplication.set({
        ...applicationData,
        status: "pending",
        rejectionReason: "",
        reviewedBy: undefined,
        reviewedAt: undefined,
      });

      const application =
        await existingApplication.save();

      return {
        message:
          "Organizer application submitted successfully.",
        application,
      };
    }

    try {
      const application =
        await OrganizerApplication.create({
          user: user._id,
          ...applicationData,
          status: "pending",
        });

      return {
        message:
          "Organizer application submitted successfully.",
        application,
      };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new Error(
          "You already have an organizer application."
        );
      }

      throw error;
    }
  };

export const getMyOrganizerApplicationService =
  async (userId: string) => {
    return OrganizerApplication.findOne({
      user: userId,
    }).select(
      "-rejectionReason -reviewedBy -reviewedAt"
    );
  };

export const getAdminOrganizerApplicationsService =
  async (
    query: AdminOrganizerApplicationsQuery
  ) => {
    const filter =
      await buildAdminApplicationFilter(query);

    const [applications, totalItems] =
      await Promise.all([
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
      message:
        "Organizer applications fetched successfully.",
      data: applications,
      applications,
      pagination: buildPagination(
        query.page,
        query.limit,
        totalItems
      ),
    };
  };

export const getAdminOrganizerApplicationByIdService =
  async (applicationId: string) => {
    getObjectIdOrThrow(
      applicationId,
      "application ID"
    );

    const application =
      await getPopulatedAdminApplication(
        applicationId
      );

    return {
      success: true,
      message:
        "Organizer application fetched successfully.",
      application,
    };
  };

export const approveOrganizerApplicationService =
  async (
    applicationId: string,
    adminId: string
  ) => {
    const adminObjectId = getObjectIdOrThrow(
      adminId,
      "admin ID"
    );

    const application =
      await getApplicationByIdOrThrow(
        applicationId
      );

    ensurePendingApplication(application);

    const applicant = await User.findOne({
      _id: application.user,
      isDeleted: false,
    });

    if (!applicant) {
      throw new OrganizerApplicationServiceError(
        "The applicant user account no longer exists.",
        404
      );
    }

    if (applicant.role !== UserRole.USER) {
      throw new OrganizerApplicationServiceError(
        "Only normal user applications can be approved.",
        409
      );
    }

    const reviewedAt = new Date();

    const updatedApplication =
      await OrganizerApplication.findOneAndUpdate(
        {
          _id: application._id,
          status: "pending",
        },
        {
          $set: {
            status: "approved",
            rejectionReason: "",
            reviewedBy: adminObjectId,
            reviewedAt,
          },
        },
        {
          returnDocument: "after",
        }
      );

    if (!updatedApplication) {
      throw new OrganizerApplicationServiceError(
        "This organizer application has already been processed.",
        409
      );
    }

    try {
      const updatedUser =
        await User.findOneAndUpdate(
          {
            _id: applicant._id,
            isDeleted: false,
            role: UserRole.USER,
          },
          {
            $set: {
              role: UserRole.ORGANIZER,
            },
          },
          {
            returnDocument: "after",
            runValidators: true,
          }
        ).select(adminApplicationUserFields);

      if (!updatedUser) {
        throw new OrganizerApplicationServiceError(
          "The applicant user could not be promoted to organizer.",
          409
        );
      }

      return {
        success: true,
        message:
          "Organizer application approved successfully.",
        application:
          await getPopulatedAdminApplication(
            updatedApplication._id
          ),
        user: updatedUser,
      };
    } catch (error) {
      await rollbackApprovedApplication(
        updatedApplication._id,
        adminObjectId
      );

      throw error;
    }
  };

export const rejectOrganizerApplicationService =
  async (
    applicationId: string,
    adminId: string,
    data: RejectOrganizerApplicationInput
  ) => {
    const adminObjectId = getObjectIdOrThrow(
      adminId,
      "admin ID"
    );

    const application =
      await getApplicationByIdOrThrow(
        applicationId
      );

    ensurePendingApplication(application);

    const updatedApplication =
      await OrganizerApplication.findOneAndUpdate(
        {
          _id: application._id,
          status: "pending",
        },
        {
          $set: {
            status: "rejected",
            rejectionReason:
              getOptionalString(
                data.rejectionReason
              ),
            reviewedBy: adminObjectId,
            reviewedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
        }
      );

    if (!updatedApplication) {
      throw new OrganizerApplicationServiceError(
        "This organizer application has already been processed.",
        409
      );
    }

    return {
      success: true,
      message:
        "Organizer application rejected successfully.",
      application:
        await getPopulatedAdminApplication(
          updatedApplication._id
        ),
    };
  };

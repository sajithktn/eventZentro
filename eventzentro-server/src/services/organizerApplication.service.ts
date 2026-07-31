import { IUser, UserRole } from "../interfaces/user.interface";
import OrganizerApplication from "../models/organizerApplication.model";
import { CreateOrganizerApplicationInput } from "../validators/organizerApplication.validator";

interface DuplicateKeyError {
  code?: number;
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

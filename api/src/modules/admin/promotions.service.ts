import Booking from "../booking/booking.model";
import Promotion from "../coupon/coupon.model";

import { buildAdminPromotionFilter, getAdminPromotionSort, getPopulatedAdminPromotion } from "./catalog.helpers";
import { buildPagination, defaultPaginationQuery, getObjectIdOrThrow, isPromotionStatus, promotionPopulate, promotionStatuses } from "./service.helpers";
import { AdminPromotionsQuery, AdminServiceError } from "./types";

export const getAdminPromotionsService = async (query: AdminPromotionsQuery = defaultPaginationQuery) => {
    const filter = await buildAdminPromotionFilter(query);
    const [promotions, totalItems,] = await Promise.all([
        Promotion.find(filter)
            .populate(promotionPopulate)
            .sort(getAdminPromotionSort(query.sort))
            .skip(query.skip)
            .limit(query.limit),
        Promotion.countDocuments(filter),
    ]);
    return {
        success: true,
        message: "Admin promotions fetched successfully.",
        data: promotions,
        promotions,
        coupons: promotions,
        pagination: buildPagination(query.page, query.limit, totalItems),
    };
};

export const updateAdminPromotionStatusService = async (promotionId: string, status: string) => {
    const promotionObjectId = getObjectIdOrThrow(promotionId, "promotion ID");
    const normalizedStatus = status.toLowerCase();
    if (!isPromotionStatus(normalizedStatus)) {
        throw new AdminServiceError(`Promotion status must be one of ${promotionStatuses.join(", ")}.`, 400);
    }
    const promotion = await Promotion.findOne({
        _id: promotionObjectId,
        isDeleted: false,
    });
    if (!promotion) {
        throw new AdminServiceError("Promotion not found.", 404);
    }
    promotion.status =
        normalizedStatus;
    promotion.isActive =
        normalizedStatus ===
            "active";
    await promotion.save();
    return getPopulatedAdminPromotion(promotion._id);
};

export const deleteAdminPromotionService = async (promotionId: string) => {
    const promotionObjectId = getObjectIdOrThrow(promotionId, "promotion ID");
    const promotion = await Promotion.findOne({
        _id: promotionObjectId,
        isDeleted: false,
    });
    if (!promotion) {
        throw new AdminServiceError("Promotion not found.", 404);
    }
    const bookingUsageCount = await Booking.countDocuments({
        $or: [
            {
                coupon: promotionObjectId,
            },
            {
                "appliedPromotion.promotionId": promotionObjectId,
            },
        ],
    });
    const hasRedeemedUsage = promotion.usedCount > 0 ||
        promotion
            .discountedTicketsUsed >
            0 ||
        bookingUsageCount > 0;
    if (hasRedeemedUsage) {
        throw new AdminServiceError("This promotion has already been used and cannot be permanently deleted. Deactivate it instead.", 409);
    }
    if (promotion
        .reservedUsageCount >
        0 ||
        promotion
            .discountedTicketsReserved >
            0) {
        throw new AdminServiceError("This promotion has active reservations and cannot be permanently deleted. Deactivate it instead.", 409);
    }
    await Promotion.deleteOne({
        _id: promotionObjectId,
    });
    return {
        success: true,
        message: "Promotion deleted successfully.",
        promotionId,
    };
};

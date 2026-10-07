export {
  createPromotion as createCoupon,
  deletePromotion as deleteCoupon,
  getPromotionById as getCouponById,
  getPromotions as getOrganizerCoupons,
  quotePromotion,
  updatePromotion as updateCoupon,
  updatePromotionStatus as updateCouponStatus,
} from "@/services/promotion.service";

export type {
  Promotion as Coupon,
  PromotionDiscountType as CouponDiscountType,
  PromotionFormData as CouponFormData,
  PromotionQuoteResponse as CouponValidationResponse,
  PromotionResponse as CouponResponse,
  PromotionsResponse as CouponsResponse,
  GetPromotionsParams as GetCouponsParams,
} from "@/types/promotion";

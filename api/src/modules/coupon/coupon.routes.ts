import { Router } from "express";

import {
  createCoupon,
  deleteCoupon,
  getCouponById,
  getCoupons,
  quotePromotion,
  updateCoupon,
  updateCouponStatus,
  validateCoupon,
} from "./coupon.controller";
import {
  optionalAuth,
  protect,
} from "../../middlewares/auth.middleware";
import { organizerOnly } from "../../middlewares/role.middleware";
import validate from "../../middlewares/validate.middleware";
import {
  couponStatusSchema,
  createCouponSchema,
  quotePromotionSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "./coupon.validation";

const router = Router();

router.post(
  "/quote",
  optionalAuth,
  validate(quotePromotionSchema),
  quotePromotion
);

router.post(
  "/validate",
  optionalAuth,
  validate(validateCouponSchema),
  validateCoupon
);

router.use(protect, organizerOnly);

router.post("/", validate(createCouponSchema), createCoupon);
router.get("/", getCoupons);
router.get("/:id", getCouponById);
router.patch(
  "/:id/status",
  validate(couponStatusSchema),
  updateCouponStatus
);
router.put("/:id", validate(updateCouponSchema), updateCoupon);
router.patch("/:id", validate(updateCouponSchema), updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;

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
} from "../controllers/coupon.controller";
import {
  optionalAuth,
  protect,
} from "../middleware/auth.middleware";
import { organizerOnly } from "../middleware/role.middleware";
import validate from "../middleware/validate.middleware";
import {
  couponStatusSchema,
  createCouponSchema,
  quotePromotionSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "../validators/coupon.validators";

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

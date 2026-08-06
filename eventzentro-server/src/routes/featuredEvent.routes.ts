import { Router } from "express";

import {
  approveFeaturedEventRequest,
  cancelOrganizerFeaturedRequest,
  createFeaturedEventPaymentOrder,
  createFeaturedEventRequest,
  getAdminFeaturedRequests,
  getEligibleFeaturedEventsForOrganizer,
  getFeaturedEventSettings,
  getOrganizerFeaturedRequests,
  rejectFeaturedEventRequest,
  updateAdminFeaturedRequest,
  updateFeaturedEventSettings,
  verifyFeaturedEventPayment,
} from "../controllers/featuredEvent.controller";
import { protect } from "../middleware/auth.middleware";
import {
  adminOnly,
  organizerOnly,
} from "../middleware/role.middleware";
import validate from "../middleware/validate.middleware";
import {
  approveFeaturedEventRequestSchema,
  createFeaturedEventRequestSchema,
  rejectFeaturedEventRequestSchema,
  updateFeaturedEventRequestSchema,
  updateFeaturedEventSettingsSchema,
  verifyFeaturedEventPaymentSchema,
} from "../validators/featuredEvent.validators";

const router = Router();

router.get(
  "/settings",
  protect,
  organizerOnly,
  getFeaturedEventSettings
);

router.get(
  "/organizer/events",
  protect,
  organizerOnly,
  getEligibleFeaturedEventsForOrganizer
);

router.get(
  "/organizer",
  protect,
  organizerOnly,
  getOrganizerFeaturedRequests
);

router.post(
  "/organizer",
  protect,
  organizerOnly,
  validate(createFeaturedEventRequestSchema),
  createFeaturedEventRequest
);

router.post(
  "/organizer/:requestId/payment/create-order",
  protect,
  organizerOnly,
  createFeaturedEventPaymentOrder
);

router.post(
  "/organizer/payment/verify",
  protect,
  organizerOnly,
  validate(verifyFeaturedEventPaymentSchema),
  verifyFeaturedEventPayment
);

router.patch(
  "/organizer/:requestId/cancel",
  protect,
  organizerOnly,
  cancelOrganizerFeaturedRequest
);

router.get(
  "/admin/settings",
  protect,
  adminOnly,
  getFeaturedEventSettings
);

router.patch(
  "/admin/settings",
  protect,
  adminOnly,
  validate(updateFeaturedEventSettingsSchema),
  updateFeaturedEventSettings
);

router.get(
  "/admin",
  protect,
  adminOnly,
  getAdminFeaturedRequests
);

router.patch(
  "/admin/:requestId/approve",
  protect,
  adminOnly,
  validate(approveFeaturedEventRequestSchema),
  approveFeaturedEventRequest
);

router.patch(
  "/admin/:requestId/reject",
  protect,
  adminOnly,
  validate(rejectFeaturedEventRequestSchema),
  rejectFeaturedEventRequest
);

router.patch(
  "/admin/:requestId",
  protect,
  adminOnly,
  validate(updateFeaturedEventRequestSchema),
  updateAdminFeaturedRequest
);

export default router;

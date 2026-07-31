import { Router } from "express";

import {
  blockAdminUser,
  changeAdminUserRole,
  createAdminCategory,
  deleteAdminCategory,
  deleteAdminEvent,
  deleteAdminPromotion,
  deleteAdminUser,
  getAdminBookingById,
  getAdminBookings,
  getAdminCategories,
  getAdminCommission,
  getAdminDashboard,
  getAdminEventById,
  getAdminEvents,
  getAdminOrganizers,
  getAdminPromotions,
  getAdminUserDetails,
  getAdminUsers,
  restoreAdminUser,
  unblockAdminUser,
  updateAdminBookingStatus,
  updateAdminCategory,
  updateAdminCategoryStatus,
  updateAdminCommission,
  updateAdminEventStatus,
  updateAdminPromotionStatus,
  verifyAdminUser,
} from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/role.middleware";
import validate from "../middleware/validate.middleware";
import { updateAdminCommissionSchema } from "../validators/admin.validators";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validators";

const router = Router();

router.use(protect, adminOnly);

router.get("/dashboard", getAdminDashboard);

router.get("/commission", getAdminCommission);
router.patch("/commission", validate(updateAdminCommissionSchema), updateAdminCommission);

router.get("/categories", getAdminCategories);
router.post("/categories", validate(createCategorySchema), createAdminCategory);
router.patch("/categories/:categoryId", validate(updateCategorySchema), updateAdminCategory);
router.patch("/categories/:categoryId/status", validate(updateCategorySchema), updateAdminCategoryStatus);
router.delete("/categories/:categoryId", deleteAdminCategory);

router.get("/users", getAdminUsers);
router.get("/organizers", getAdminOrganizers);
router.get("/users/:userId", getAdminUserDetails);
router.patch("/users/:userId/block", blockAdminUser);
router.patch("/users/:userId/unblock", unblockAdminUser);
router.patch("/users/:userId/verify", verifyAdminUser);
router.patch("/users/:userId/role", changeAdminUserRole);
router.patch("/users/:userId/restore", restoreAdminUser);
router.delete("/users/:userId", deleteAdminUser);

router.get("/events", getAdminEvents);
router.get("/events/:eventId", getAdminEventById);
router.patch("/events/:eventId/status", updateAdminEventStatus);
router.delete("/events/:eventId", deleteAdminEvent);

router.get("/bookings", getAdminBookings);
router.get("/bookings/:bookingId", getAdminBookingById);
router.patch("/bookings/:bookingId/status", updateAdminBookingStatus);

router.get("/promotions", getAdminPromotions);
router.patch("/promotions/:promotionId/status", updateAdminPromotionStatus);
router.delete("/promotions/:promotionId", deleteAdminPromotion);

export default router;
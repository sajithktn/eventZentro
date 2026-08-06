import { Router } from "express";

import {
  approveOrganizerApplication,
  createOrganizerApplication,
  getAdminOrganizerApplicationById,
  getAdminOrganizerApplications,
  getMyOrganizerApplication,
  rejectOrganizerApplication,
} from "../controllers/organizerApplication.controller";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/role.middleware";
import validate from "../middleware/validate.middleware";
import {
  createOrganizerApplicationSchema,
  rejectOrganizerApplicationSchema,
} from "../validators/organizerApplication.validator";

const router = Router();

router.get(
  "/admin",
  protect,
  adminOnly,
  getAdminOrganizerApplications
);

router.get(
  "/admin/:id",
  protect,
  adminOnly,
  getAdminOrganizerApplicationById
);

router.patch(
  "/admin/:id/approve",
  protect,
  adminOnly,
  approveOrganizerApplication
);

router.patch(
  "/admin/:id/reject",
  protect,
  adminOnly,
  validate(rejectOrganizerApplicationSchema),
  rejectOrganizerApplication
);

router.post(
  "/",
  protect,
  validate(createOrganizerApplicationSchema),
  createOrganizerApplication
);

router.get(
  "/me",
  protect,
  getMyOrganizerApplication
);

export default router;

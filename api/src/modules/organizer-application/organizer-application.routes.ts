import { Router } from "express";

import {
  approveOrganizerApplication,
  createOrganizerApplication,
  getAdminOrganizerApplicationById,
  getAdminOrganizerApplications,
  getMyOrganizerApplication,
  rejectOrganizerApplication,
} from "./organizer-application.controller";
import { protect } from "../../middlewares/auth.middleware";
import { adminOnly } from "../../middlewares/role.middleware";
import validate from "../../middlewares/validate.middleware";
import {
  createOrganizerApplicationSchema,
  rejectOrganizerApplicationSchema,
} from "./organizer-application.validation";

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

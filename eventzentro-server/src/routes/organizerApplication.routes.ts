import { Router } from "express";

import {
  createOrganizerApplication,
  getMyOrganizerApplication,
} from "../controllers/organizerApplication.controller";
import { protect } from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import { createOrganizerApplicationSchema } from "../validators/organizerApplication.validator";

const router = Router();

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

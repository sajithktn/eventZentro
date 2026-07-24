import { Router } from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
} from "../controllers/event.controller";
import validate from "../middleware/validate.middleware";
import { createEventSchema } from "../validators/event.validators";
import { optionalAuth, protect } from "../middleware/auth.middleware";
import { organizerOnly } from "../middleware/role.middleware";

const router = Router();

router.get("/", optionalAuth, getAllEvents);

router.get("/:id", getEventById);

router.post(
  "/",
  protect,
  organizerOnly,
  validate(createEventSchema),
  createEvent
);

router.put(
  "/:id",
  protect,
  organizerOnly,
  validate(createEventSchema),
  updateEvent
);

export default router;

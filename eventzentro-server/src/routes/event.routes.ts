import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  getEventLocations,
  getEventPromotions,
  getOrganizerDashboard,
  getOrganizerEventById,
  getOrganizerEvents,
  updateEvent,
} from "../controllers/event.controller";
import validate from "../middleware/validate.middleware";
import { createEventSchema } from "../validators/event.validators";
import {
  optionalAuth,
  protect,
} from "../middleware/auth.middleware";
import { organizerOnly } from "../middleware/role.middleware";

const router = Router();

router.get("/", optionalAuth, getAllEvents);

router.get("/locations", getEventLocations);

router.get(
  "/organizer/dashboard",
  protect,
  organizerOnly,
  getOrganizerDashboard
);

router.get(
  "/organizer/my",
  protect,
  organizerOnly,
  getOrganizerEvents
);

router.get(
  "/organizer/:id",
  protect,
  organizerOnly,
  getOrganizerEventById
);

router.get("/:eventId/promotions", getEventPromotions);

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

router.delete(
  "/:id",
  protect,
  organizerOnly,
  deleteEvent
);

export default router;

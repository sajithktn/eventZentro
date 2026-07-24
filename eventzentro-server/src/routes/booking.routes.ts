import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getOrganizerBookings,
} from "../controllers/booking.controller";
import { protect } from "../middleware/auth.middleware";
import { organizerOnly } from "../middleware/role.middleware";

const router = Router();

router.post("/", protect, createBooking);

router.get("/my", protect, getMyBookings);

router.get(
  "/organizer",
  protect,
  organizerOnly,
  getOrganizerBookings
);

export default router;

import { Router } from "express";
import {
  cancelPendingBooking,
  createBooking,
  createRazorpayOrder,
  getMyBookings,
  getOrganizerBookings,
  verifyRazorpayPayment,
} from "../controllers/booking.controller";
import { protect } from "../middleware/auth.middleware";
import { organizerOnly } from "../middleware/role.middleware";
import validate from "../middleware/validate.middleware";
import {
  createBookingSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema,
} from "../validators/booking.validators";

const router = Router();

router.post("/", protect, validate(createBookingSchema), createBooking);

router.post("/payment/create-order", protect, validate(createPaymentOrderSchema), createRazorpayOrder);

router.post("/payment/verify", protect, validate(verifyPaymentSchema), verifyRazorpayPayment);

router.get("/my", protect, getMyBookings);

router.get("/organizer", protect, organizerOnly, getOrganizerBookings);

router.patch("/:id/cancel", protect, cancelPendingBooking);

export default router;

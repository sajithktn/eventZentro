import { Router } from "express";
import {
  cancelPendingBooking,
  createBooking,
  createRazorpayOrder,
  getMyBookings,
  getOrganizerBookings,
  verifyRazorpayPayment,
} from "./booking.controller";
import { protect } from "../../middlewares/auth.middleware";
import { organizerOnly } from "../../middlewares/role.middleware";
import validate from "../../middlewares/validate.middleware";
import {
  createBookingSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema,
} from "./booking.validation";

const router = Router();

router.post("/", protect, validate(createBookingSchema), createBooking);

router.post("/payment/create-order", protect, validate(createPaymentOrderSchema), createRazorpayOrder);

router.post("/payment/verify", protect, validate(verifyPaymentSchema), verifyRazorpayPayment);

router.get("/my", protect, getMyBookings);

router.get("/organizer", protect, organizerOnly, getOrganizerBookings);

router.patch("/:id/cancel", protect, cancelPendingBooking);

export default router;

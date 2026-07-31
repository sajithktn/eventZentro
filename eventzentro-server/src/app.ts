import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

import "./config/passport";

import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";
import bookingRoutes from "./routes/booking.routes";
import couponRoutes from "./routes/coupon.routes";
import adminRoutes from "./routes/admin.routes";
import categoryRoutes from "./routes/category.routes";
import organizerApplicationRoutes from "./routes/organizerApplication.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to EventZentro API",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/promotions", couponRoutes);
app.use("/api/coupons", couponRoutes);

app.use(
  "/api/organizer-applications",
  organizerApplicationRoutes
);

app.use("/api/admin", adminRoutes);

export default app;
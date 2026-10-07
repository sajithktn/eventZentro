import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

import "./config/passport";

import uploadRoutes from "./modules/upload/upload.routes";
import authRoutes from "./modules/auth/auth.routes";
import eventRoutes from "./modules/event/event.routes";
import bookingRoutes from "./modules/booking/booking.routes";
import couponRoutes from "./modules/coupon/coupon.routes";
import adminRoutes from "./modules/admin/admin.routes";
import categoryRoutes from "./modules/category/category.routes";
import featuredEventRoutes from "./modules/featured-event/featured-event.routes";
import organizerApplicationRoutes from "./modules/organizer-application/organizer-application.routes";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
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
app.use("/api/featured-events", featuredEventRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(
  "/api/organizer-applications",
  organizerApplicationRoutes
);

app.use("/api/admin", adminRoutes);

// Catch-all 404 handler for undefined API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Requested API endpoint not found.",
  });
});

// Global unhandled error middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled API error:", err);

  const errorObj = err as { statusCode?: number; status?: number; message?: string; name?: string };
  const statusCode = errorObj.statusCode || errorObj.status || (errorObj.name === "CastError" ? 400 : 500);
  const message = errorObj.message || "Internal server error.";

  res.status(statusCode).json({
    success: false,
    message,
  });
});

export default app;

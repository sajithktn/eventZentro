import crypto from "crypto";
import { QueryFilter, Types } from "mongoose";
import { PaginatedApiResponse } from "../interfaces/pagination.interface";
import { IBooking } from "../interfaces/booking.interface";
import Booking from "../models/booking.model";
import Event from "../models/event.model";
import User from "../models/user.models";
import razorpay from "../config/razorpay";
import {
  getPromotionQuoteService,
  releasePromotionReservationByBooking,
  reservePromotionForBooking,
  restoreRedeemedPromotionReservation,
  redeemPromotionReservation,
  toRazorpayPaise,
} from "./coupon.service";
import {
  buildPaginationMetadata,
  escapeRegExp,
  ParsedPaginationQuery,
} from "../utils/pagination";
import {
  getActiveAdminCommissionPercentageService,
} from "./commission.service";

type SortDirection = 1 | -1;
type BookingSort = Record<string, SortDirection>;

interface VerifyPaymentData {
  bookingId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const defaultPaginationQuery: ParsedPaginationQuery = {
  page: 1,
  limit: 10,
  skip: 0,
};

const getBookingSort = (sort?: string): BookingSort => {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };

    case "amount-high":
      return { totalAmount: -1 };

    case "amount-low":
      return { totalAmount: 1 };

    default:
      return { createdAt: -1 };
  }
};

const getMatchingEventIds = async (
  searchRegex: RegExp,
  eventIds?: Types.ObjectId[]
) => {
  const eventFilter: QueryFilter<{
    title: string;
    venue: string;
    category: string;
  }> = {
    $or: [
      { title: searchRegex },
      { venue: searchRegex },
      { category: searchRegex },
    ],
  };

  if (eventIds) {
    eventFilter._id = { $in: eventIds };
  }

  const events = await Event.find(eventFilter).select("_id");

  return events.map((event) => event._id);
};

const getMatchingUserIds = async (
  searchRegex: RegExp
) => {
  const users = await User.find({
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ],
  }).select("_id");

  return users.map((user) => user._id);
};

const applyBookingStatusFilter = (
  filter: QueryFilter<IBooking>,
  status?: string
) => {
  if (!status || status.toLowerCase() === "all") {
    return;
  }

  filter.status =
    status.toLowerCase() as IBooking["status"];
};

const getEmptyPaginatedBookings = (
  query: ParsedPaginationQuery,
  message: string
): PaginatedApiResponse<IBooking> => ({
  success: true,
  message,
  data: [],
  pagination: buildPaginationMetadata(
    query.page,
    query.limit,
    0
  ),
});

const createBookingCode = () =>
  `EZ-${Date.now()
    .toString(36)
    .toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

const roundMoney = (amount: number) =>
  Math.round(
    (amount + Number.EPSILON) * 100
  ) / 100;

const calculateCommission = async (
  amount: number
) => {
  const adminCommissionRate =
    await getActiveAdminCommissionPercentageService();

  const amountPaid = roundMoney(amount);

  const adminCommissionAmount = roundMoney(
    amountPaid *
      (adminCommissionRate / 100)
  );

  const organizerEarnings = roundMoney(
    amountPaid - adminCommissionAmount
  );

  return {
    amountPaid,
    adminCommissionRate,
    adminCommissionAmount,
    organizerEarnings,
    commissionCalculatedAt: new Date(),
  };
};

const signaturesMatch = (
  expectedSignature: string,
  receivedSignature: string
) => {
  const expectedBuffer = Buffer.from(
    expectedSignature,
    "hex"
  );

  const receivedBuffer = Buffer.from(
    receivedSignature,
    "hex"
  );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
};

const getBookingTicketCount = (
  booking: IBooking
) =>
  booking.ticketCount ||
  booking.quantity;

const getAppliedPromotionId = (
  booking: IBooking
) =>
  booking.appliedPromotion?.promotionId ||
  undefined;

type PromotionQuote = Awaited<
  ReturnType<
    typeof getPromotionQuoteService
  >
>;

const getPromotionSnapshotFromQuote = (
  quote: PromotionQuote
) => {
  if (!quote.appliedPromotion) {
    return undefined;
  }

  return {
    promotionId: new Types.ObjectId(
      quote.appliedPromotion.id
    ),
    name: quote.appliedPromotion.name,
    code: quote.appliedPromotion.code,
    promotionMode:
      quote.appliedPromotion.promotionMode,
    discountType:
      quote.appliedPromotion.discountType,
    discountValue:
      quote.appliedPromotion.discountValue,
    displayText:
      quote.appliedPromotion.displayText,
  };
};

const applyQuoteToBooking = (
  booking: IBooking,
  quote: PromotionQuote,
  ticketCount: number
) => {
  booking.quantity = ticketCount;
  booking.ticketCount = ticketCount;
  booking.originalAmount = quote.subtotal;
  booking.subtotalAmount = quote.subtotal;
  booking.discountAmount =
    quote.discountAmount;
  booking.finalAmount = quote.finalAmount;
  booking.totalAmount = quote.finalAmount;
  booking.appliedPromotion =
    getPromotionSnapshotFromQuote(quote);

  const appliedPromotionId =
    getAppliedPromotionId(booking);

  if (
    appliedPromotionId &&
    quote.appliedPromotion
      ?.promotionMode === "coupon" &&
    quote.appliedPromotion.code
  ) {
    booking.coupon =
      new Types.ObjectId(
        appliedPromotionId
      );

    booking.couponCode =
      quote.appliedPromotion.code;

    return;
  }

  booking.coupon = undefined;
  booking.couponCode = undefined;
};

const populateBookingById = async (
  bookingId: string | Types.ObjectId
) => {
  const booking =
    await Booking.findById(
      bookingId
    ).populate([
      {
        path: "event",
        populate: {
          path: "organizer",
          select:
            "firstName lastName email",
        },
      },
      {
        path: "user",
        select:
          "firstName lastName email",
      },
      {
        path: "promotionReservation",
      },
    ]);

  if (!booking) {
    throw new Error(
      "Failed to retrieve created booking."
    );
  }

  return booking;
};

export const createBookingService =
  async (
    eventId: string,
    userId: string,
    quantity: number,
    couponCode?: string
  ) => {
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error(
        "Ticket quantity must be at least 1."
      );
    }

    const quote =
      await getPromotionQuoteService({
        eventId,
        userId,
        ticketCount: quantity,
        couponCode,
      });

    const event =
      await Event.findById(eventId);

    if (!event) {
      throw new Error(
        "Event not found."
      );
    }

    const isFreeBooking =
      quote.finalAmount === 0;

    const booking = new Booking({
      user: new Types.ObjectId(
        userId
      ),
      event: new Types.ObjectId(
        event._id.toString()
      ),
      quantity,
      ticketCount: quantity,
      status: isFreeBooking
        ? "confirmed"
        : "pending",
      paymentStatus: isFreeBooking
        ? "paid"
        : "unpaid",
      amountPaid: 0,
      bookingCode:
        createBookingCode(),
    });

    applyQuoteToBooking(
      booking,
      quote,
      quantity
    );

    if (isFreeBooking) {
      Object.assign(
        booking,
        await calculateCommission(
          quote.finalAmount
        )
      );

      booking.paidAt = new Date();
    }

    let ticketsClaimed = false;
    let redeemedReservation = false;

    try {
      const appliedPromotionId =
        getAppliedPromotionId(
          booking
        );

      if (
        isFreeBooking &&
        appliedPromotionId
      ) {
        const reservation =
          await reservePromotionForBooking(
            {
              bookingId:
                booking._id,
              userId:
                booking.user,
              eventId:
                booking.event,
              promotionId:
                appliedPromotionId,
              ticketCount:
                quantity,
              subtotalAmount:
                quote.subtotal,
              discountAmount:
                quote.discountAmount,
            }
          );

        booking.promotionReservation =
          reservation._id;
      }

      if (isFreeBooking) {
        const updatedEvent =
          await Event.findOneAndUpdate(
            {
              _id: event._id,
              availableTickets: {
                $gte: quantity,
              },
            },
            {
              $inc: {
                availableTickets:
                  -quantity,
              },
            },
            {
              new: true,
            }
          );

        if (!updatedEvent) {
          throw new Error(
            "Not enough tickets available."
          );
        }

        ticketsClaimed = true;

        event.availableTickets =
          updatedEvent.availableTickets;
      }

      if (
        isFreeBooking &&
        booking.promotionReservation
      ) {
        await redeemPromotionReservation(
          booking.promotionReservation,
          booking._id
        );

        redeemedReservation = true;
      }

      await booking.save();
    } catch (error) {
      if (ticketsClaimed) {
        await Event.findByIdAndUpdate(
          event._id,
          {
            $inc: {
              availableTickets:
                quantity,
            },
          }
        );
      }

      if (
        redeemedReservation &&
        booking.promotionReservation
      ) {
        await restoreRedeemedPromotionReservation(
          booking.promotionReservation,
          booking._id
        );
      }

      if (
        booking.promotionReservation
      ) {
        await releasePromotionReservationByBooking(
          booking._id
        );
      }

      throw error;
    }

    return {
      booking:
        await populateBookingById(
          booking._id
        ),
      event,
    };
  };

export const createPaymentBooking =
  async (
    bookingId: string,
    userId: string
  ) => {
    const booking =
      await Booking.findOne({
        _id: bookingId,
        user: userId,
      });

    if (!booking) {
      throw new Error(
        "Booking not found."
      );
    }

    if (
      booking.status ===
      "cancelled"
    ) {
      throw new Error(
        "Payment cannot be made for a cancelled booking."
      );
    }

    if (
      booking.paymentStatus ===
      "paid"
    ) {
      throw new Error(
        "Booking payment is already completed."
      );
    }

    if (
      booking.paymentStatus ===
      "verifying"
    ) {
      throw new Error(
        "Payment verification is already in progress."
      );
    }

    const event =
      await Event.findById(
        booking.event
      );

    if (!event) {
      throw new Error(
        "Event not found."
      );
    }

    if (
      event.status !==
      "published"
    ) {
      throw new Error(
        "This event is not available for booking."
      );
    }

    const ticketCount =
      getBookingTicketCount(
        booking
      );

    if (
      event.availableTickets <
      ticketCount
    ) {
      throw new Error(
        "Not enough tickets available."
      );
    }

    const quote =
      await getPromotionQuoteService({
        eventId:
          event._id.toString(),
        userId,
        ticketCount,
        couponCode:
          booking.couponCode,
      });

    applyQuoteToBooking(
      booking,
      quote,
      ticketCount
    );

    let appliedPromotionId =
      getAppliedPromotionId(
        booking
      );

    if (!appliedPromotionId) {
      await releasePromotionReservationByBooking(
        booking._id
      );

      booking.promotionReservation =
        undefined;
    }

    if (
      quote.finalAmount <= 0
    ) {
      let ticketsClaimed = false;
      let redeemedReservation =
        false;

      try {
        appliedPromotionId =
          getAppliedPromotionId(
            booking
          );

        if (
          appliedPromotionId
        ) {
          const reservation =
            await reservePromotionForBooking(
              {
                bookingId:
                  booking._id,
                userId:
                  booking.user,
                eventId:
                  booking.event,
                promotionId:
                  appliedPromotionId,
                ticketCount,
                subtotalAmount:
                  quote.subtotal,
                discountAmount:
                  quote.discountAmount,
              }
            );

          booking.promotionReservation =
            reservation._id;
        }

        const updatedEvent =
          await Event.findOneAndUpdate(
            {
              _id: event._id,
              availableTickets: {
                $gte:
                  ticketCount,
              },
            },
            {
              $inc: {
                availableTickets:
                  -ticketCount,
              },
            },
            {
              new: true,
            }
          );

        if (!updatedEvent) {
          throw new Error(
            "Not enough tickets available."
          );
        }

        ticketsClaimed = true;

        if (
          booking.promotionReservation
        ) {
          await redeemPromotionReservation(
            booking.promotionReservation,
            booking._id
          );

          redeemedReservation =
            true;
        }

        Object.assign(
          booking,
          await calculateCommission(
            quote.finalAmount
          )
        );

        booking.status =
          "confirmed";
        booking.paymentStatus =
          "paid";
        booking.paidAt =
          new Date();

        await booking.save();

        return {
          bookingId:
            booking._id,
          order: null,
          amountToPay: 0,
          key:
            process.env
              .RAZORPAY_KEY_ID,
          freeBooking: true,
        };
      } catch (error) {
        if (ticketsClaimed) {
          await Event.findByIdAndUpdate(
            event._id,
            {
              $inc: {
                availableTickets:
                  ticketCount,
              },
            }
          );
        }

        if (
          redeemedReservation &&
          booking.promotionReservation
        ) {
          await restoreRedeemedPromotionReservation(
            booking.promotionReservation,
            booking._id
          );
        }

        if (
          booking.promotionReservation
        ) {
          await releasePromotionReservationByBooking(
            booking._id
          );
        }

        throw error;
      }
    }

    if (
      booking.razorpayOrderId &&
      booking.paymentStatus ===
        "pending"
    ) {
      appliedPromotionId =
        getAppliedPromotionId(
          booking
        );

      if (
        appliedPromotionId
      ) {
        const reservation =
          await reservePromotionForBooking(
            {
              bookingId:
                booking._id,
              userId:
                booking.user,
              eventId:
                booking.event,
              promotionId:
                appliedPromotionId,
              ticketCount,
              subtotalAmount:
                quote.subtotal,
              discountAmount:
                quote.discountAmount,
            }
          );

        booking.promotionReservation =
          reservation._id;

        await booking.save();
      }

      const existingOrder =
        await razorpay.orders.fetch(
          booking.razorpayOrderId
        );

      if (
        existingOrder.status ===
        "paid"
      ) {
        throw new Error(
          "Payment is completed and awaiting verification."
        );
      }

      if (
        Number(
          existingOrder.amount
        ) ===
        toRazorpayPaise(
          quote.finalAmount
        )
      ) {
        await booking.save();

        return {
          bookingId:
            booking._id,
          order: existingOrder,
          amountToPay:
            quote.finalAmount,
          key:
            process.env
              .RAZORPAY_KEY_ID,
        };
      }
    }

    let reservationId:
      | Types.ObjectId
      | undefined;

    appliedPromotionId =
      getAppliedPromotionId(
        booking
      );

    if (appliedPromotionId) {
      const reservation =
        await reservePromotionForBooking(
          {
            bookingId:
              booking._id,
            userId:
              booking.user,
            eventId:
              booking.event,
            promotionId:
              appliedPromotionId,
            ticketCount,
            subtotalAmount:
              quote.subtotal,
            discountAmount:
              quote.discountAmount,
          }
        );

      reservationId =
        reservation._id;

      booking.promotionReservation =
        reservation._id;
    }

    const amountToPay =
      quote.finalAmount;

    try {
      const order =
        await razorpay.orders.create(
          {
            amount:
              toRazorpayPaise(
                amountToPay
              ),
            currency: "INR",
            receipt:
              `booking_${bookingId}`,
            notes: {
              bookingId,
              eventId:
                event._id.toString(),
              userId,
            },
          }
        );

      booking.razorpayOrderId =
        order.id;

      booking.paymentStatus =
        "pending";

      await booking.save();

      return {
        bookingId:
          booking._id,
        order,
        amountToPay,
        key:
          process.env
            .RAZORPAY_KEY_ID,
      };
    } catch (error) {
      if (reservationId) {
        await releasePromotionReservationByBooking(
          booking._id
        );
      }

      throw error;
    }
  };

export const cancelPendingBookingService =
  async (
    bookingId: string,
    userId: string
  ) => {
    const booking =
      await Booking.findOne({
        _id: bookingId,
        user: userId,
      });

    if (!booking) {
      throw new Error(
        "Booking not found."
      );
    }

    if (
      booking.paymentStatus ===
      "paid"
    ) {
      throw new Error(
        "Paid bookings cannot be cancelled from this flow."
      );
    }

    if (
      booking.status ===
      "cancelled"
    ) {
      return {
        success: true,
        bookingId:
          booking._id,
        message:
          "Booking is already cancelled.",
      };
    }

    await releasePromotionReservationByBooking(
      booking._id
    );

    booking.status =
      "cancelled";

    booking.paymentStatus =
      "failed";

    await booking.save();

    return {
      success: true,
      bookingId:
        booking._id,
      message:
        "Booking cancelled successfully.",
    };
  };

export const verifyPaymentRazorpay =
  async (
    userId: string,
    data: VerifyPaymentData
  ) => {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = data;

    const booking =
      await Booking.findOne({
        _id: bookingId,
        user: userId,
      });

    if (!booking) {
      throw new Error(
        "Booking not found."
      );
    }

    if (
      booking.paymentStatus ===
      "paid"
    ) {
      return {
        success: true,
        bookingId:
          booking._id,
        message:
          "Payment is already verified.",
      };
    }

    if (
      booking.paymentStatus ===
      "verifying"
    ) {
      return {
        success: true,
        bookingId:
          booking._id,
        message:
          "Payment verification is already in progress.",
      };
    }

    if (
      booking.status ===
      "cancelled"
    ) {
      throw new Error(
        "Payment cannot be verified for a cancelled booking."
      );
    }

    if (
      booking.totalAmount <= 0
    ) {
      throw new Error(
        "Payment verification is not required for this booking."
      );
    }

    if (
      !booking.razorpayOrderId
    ) {
      throw new Error(
        "Razorpay order was not created for this booking."
      );
    }

    const storedRazorpayOrderId =
      booking.razorpayOrderId;

    if (
      storedRazorpayOrderId !==
      razorpay_order_id
    ) {
      throw new Error(
        "Razorpay order ID mismatch."
      );
    }

    const keySecret =
      process.env
        .RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new Error(
        "Razorpay key secret is not configured."
      );
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          keySecret
        )
        .update(
          `${storedRazorpayOrderId}|${razorpay_payment_id}`
        )
        .digest("hex");

    if (
      !signaturesMatch(
        expectedSignature,
        razorpay_signature
      )
    ) {
      throw new Error(
        "Invalid payment signature."
      );
    }

    const payment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    const expectedAmount =
      toRazorpayPaise(
        booking.finalAmount ??
          booking.totalAmount
      );

    if (
      payment.order_id !==
      storedRazorpayOrderId
    ) {
      throw new Error(
        "Payment does not belong to this booking order."
      );
    }

    if (
      Number(payment.amount) !==
      expectedAmount
    ) {
      throw new Error(
        "Payment amount does not match the booking amount."
      );
    }

    if (
      payment.currency !==
      "INR"
    ) {
      throw new Error(
        "Invalid payment currency."
      );
    }

    if (
      payment.status !==
      "captured"
    ) {
      throw new Error(
        "Payment has not been captured."
      );
    }

    const lockedBooking =
      await Booking.findOneAndUpdate(
        {
          _id: bookingId,
          user: userId,
          paymentStatus:
            "pending",
          razorpayOrderId:
            storedRazorpayOrderId,
        },
        {
          $set: {
            paymentStatus:
              "verifying",
          },
        },
        {
          new: true,
        }
      );

    if (!lockedBooking) {
      const latestBooking =
        await Booking.findOne({
          _id: bookingId,
          user: userId,
        });

      if (
        latestBooking
          ?.paymentStatus ===
        "paid"
      ) {
        return {
          success: true,
          bookingId,
          message:
            "Payment is already verified.",
        };
      }

      if (
        latestBooking
          ?.paymentStatus ===
        "verifying"
      ) {
        return {
          success: true,
          bookingId,
          message:
            "Payment verification is already in progress.",
        };
      }

      throw new Error(
        "Payment verification could not be started."
      );
    }

    const ticketCount =
      getBookingTicketCount(
        lockedBooking
      );

    const revenue =
      await calculateCommission(
        lockedBooking.finalAmount ??
          lockedBooking.totalAmount
      );

    let ticketsClaimed = false;
    let ticketsRestored = false;
    let promotionRedeemed =
      false;

    const restoreTickets =
      async () => {
        if (
          !ticketsClaimed ||
          ticketsRestored
        ) {
          return;
        }

        await Event.findByIdAndUpdate(
          lockedBooking.event,
          {
            $inc: {
              availableTickets:
                ticketCount,
            },
          }
        );

        ticketsRestored = true;
      };

    let confirmedBooking:
      | IBooking
      | null = null;

    try {
      const appliedPromotionId =
        getAppliedPromotionId(
          lockedBooking
        );

      if (
        appliedPromotionId
      ) {
        if (
          !lockedBooking
            .promotionReservation
        ) {
          throw new Error(
            "Promotion reservation was not found for this booking."
          );
        }

        await redeemPromotionReservation(
          lockedBooking
            .promotionReservation,
          lockedBooking._id
        );

        promotionRedeemed = true;
      }

      const updatedEvent =
        await Event.findOneAndUpdate(
          {
            _id:
              lockedBooking.event,
            availableTickets: {
              $gte:
                ticketCount,
            },
          },
          {
            $inc: {
              availableTickets:
                -ticketCount,
            },
          },
          {
            new: true,
          }
        );

      if (!updatedEvent) {
        throw new Error(
          "Not enough tickets are available."
        );
      }

      ticketsClaimed = true;

      confirmedBooking =
        await Booking.findOneAndUpdate(
          {
            _id: bookingId,
            user: userId,
            paymentStatus:
              "verifying",
            razorpayOrderId:
              storedRazorpayOrderId,
          },
          {
            $set: {
              razorpayOrderId:
                razorpay_order_id,
              razorpayPaymentId:
                razorpay_payment_id,
              razorpaySignature:
                razorpay_signature,
              paymentStatus:
                "paid",
              status:
                "confirmed",
              amountPaid:
                revenue.amountPaid,
              adminCommissionRate:
                revenue
                  .adminCommissionRate,
              adminCommissionAmount:
                revenue
                  .adminCommissionAmount,
              organizerEarnings:
                revenue
                  .organizerEarnings,
              commissionCalculatedAt:
                revenue
                  .commissionCalculatedAt,
              paidAt:
                new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (!confirmedBooking) {
        await restoreTickets();

        if (
          promotionRedeemed &&
          lockedBooking
            .promotionReservation
        ) {
          await restoreRedeemedPromotionReservation(
            lockedBooking
              .promotionReservation,
            lockedBooking._id
          );
        }

        const latestBooking =
          await Booking.findOne({
            _id: bookingId,
            user: userId,
          });

        if (
          latestBooking
            ?.paymentStatus ===
          "paid"
        ) {
          return {
            success: true,
            bookingId,
            message:
              "Payment is already verified.",
          };
        }

        throw new Error(
          "Payment verification could not be completed."
        );
      }
    } catch (error) {
      await restoreTickets();

      if (
        promotionRedeemed &&
        lockedBooking
          .promotionReservation
      ) {
        await restoreRedeemedPromotionReservation(
          lockedBooking
            .promotionReservation,
          lockedBooking._id
        );
      }

      await Booking.findOneAndUpdate(
        {
          _id: bookingId,
          user: userId,
          paymentStatus:
            "verifying",
        },
        {
          $set: {
            paymentStatus:
              "pending",
          },
        }
      );

      throw error;
    }

    return {
      success: true,
      bookingId,
      message:
        "Payment verified and booking confirmed successfully.",
    };
  };

export const getMyBookingsService =
  async (
    userId: string,
    query =
      defaultPaginationQuery
  ): Promise<
    PaginatedApiResponse<IBooking>
  > => {
    const filter:
      QueryFilter<IBooking> = {
      user: userId,
    };

    applyBookingStatusFilter(
      filter,
      query.status
    );

    if (query.search) {
      const searchRegex =
        new RegExp(
          escapeRegExp(
            query.search
          ),
          "i"
        );

      const eventIds =
        await getMatchingEventIds(
          searchRegex
        );

      const searchFilters:
        QueryFilter<IBooking>[] =
          [
            {
              bookingCode:
                searchRegex,
            },
          ];

      if (
        eventIds.length > 0
      ) {
        searchFilters.push({
          event: {
            $in: eventIds,
          },
        });
      }

      filter.$or =
        searchFilters;
    }

    const [
      bookings,
      totalItems,
    ] = await Promise.all([
      Booking.find(filter)
        .populate({
          path: "event",
          populate: {
            path: "organizer",
            select:
              "firstName lastName email",
          },
        })
        .sort(
          getBookingSort(
            query.sort
          )
        )
        .skip(query.skip)
        .limit(query.limit),

      Booking.countDocuments(
        filter
      ),
    ]);

    return {
      success: true,
      message:
        "Bookings fetched successfully.",
      data: bookings,
      pagination:
        buildPaginationMetadata(
          query.page,
          query.limit,
          totalItems
        ),
    };
  };

export const getOrganizerBookingsService =
  async (
    organizerId: string,
    includeAll: boolean,
    query =
      defaultPaginationQuery
  ): Promise<
    PaginatedApiResponse<IBooking>
  > => {
    const events =
      await Event.find(
        includeAll
          ? {}
          : {
              organizer:
                organizerId,
            }
      ).select("_id");

    const eventIds =
      events.map(
        (event) =>
          event._id
      );

    if (
      eventIds.length === 0
    ) {
      return getEmptyPaginatedBookings(
        query,
        "Bookings fetched successfully."
      );
    }

    const filter:
      QueryFilter<IBooking> = {
      event: {
        $in: eventIds,
      },
    };

    applyBookingStatusFilter(
      filter,
      query.status
    );

    if (query.search) {
      const searchRegex =
        new RegExp(
          escapeRegExp(
            query.search
          ),
          "i"
        );

      const [
        matchingEventIds,
        matchingUserIds,
      ] =
        await Promise.all([
          getMatchingEventIds(
            searchRegex,
            eventIds
          ),
          getMatchingUserIds(
            searchRegex
          ),
        ]);

      const searchFilters:
        QueryFilter<IBooking>[] =
          [
            {
              bookingCode:
                searchRegex,
            },
          ];

      if (
        matchingEventIds.length >
        0
      ) {
        searchFilters.push({
          event: {
            $in:
              matchingEventIds,
          },
        });
      }

      if (
        matchingUserIds.length >
        0
      ) {
        searchFilters.push({
          user: {
            $in:
              matchingUserIds,
          },
        });
      }

      filter.$or =
        searchFilters;
    }

    const [
      bookings,
      totalItems,
    ] = await Promise.all([
      Booking.find(filter)
        .populate(
          "user",
          "firstName lastName email"
        )
        .populate({
          path: "event",
          populate: {
            path: "organizer",
            select:
              "firstName lastName email",
          },
        })
        .sort(
          getBookingSort(
            query.sort
          )
        )
        .skip(query.skip)
        .limit(query.limit),

      Booking.countDocuments(
        filter
      ),
    ]);

    return {
      success: true,
      message:
        "Bookings fetched successfully.",
      data: bookings,
      pagination:
        buildPaginationMetadata(
          query.page,
          query.limit,
          totalItems
        ),
    };
  };
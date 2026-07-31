import mongoose, { Schema } from "mongoose";
import { IEvent } from "../interfaces/event.interface";

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    venue: {
      type: String,
      required: true,
      trim: true,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalTickets: {
      type: Number,
      required: true,
      min: 1,
    },

    availableTickets: {
      type: Number,
      required: true,
      min: 0,
    },

    bannerImage: {
      type: String,
      default: "",
    },

    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "cancelled"],
      default: "draft",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({
  city: 1,
  status: 1,
  eventDate: 1,
});

export default mongoose.model<IEvent>("Event", eventSchema);
import mongoose, { Schema } from "mongoose";

import {
  IFeaturedEventSetting,
} from "../interfaces/featuredEvent.interface";

const featuredEventSettingSchema =
  new Schema<IFeaturedEventSetting>(
    {
      promotionFee: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      isPromotionEnabled: {
        type: Boolean,
        required: true,
        default: true,
      },

      maximumFeaturedEventsOnHomepage: {
        type: Number,
        required: true,
        default: 3,
        min: 1,
        max: 12,
      },

      defaultPromotionDurationDays: {
        type: Number,
        min: 1,
        max: 365,
      },

      requirePaymentBeforeApproval: {
        type: Boolean,
        required: true,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<IFeaturedEventSetting>(
  "FeaturedEventSetting",
  featuredEventSettingSchema
);

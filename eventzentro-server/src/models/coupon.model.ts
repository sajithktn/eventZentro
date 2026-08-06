import mongoose, { Schema } from "mongoose";

import { IPromotion } from "../interfaces/coupon.interface";

type PromotionIndexDescription = {
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
};

const activeCouponCodeIndexName =
  "unique_active_coupon_code_per_event";

const couponSchema = new Schema<IPromotion>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 800,
    },

    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[A-Z0-9_-]+$/,
      required(this: IPromotion) {
        return this.promotionMode === "coupon";
      },
    },

    promotionMode: {
      type: String,
      enum: ["coupon", "automatic"],
      default: "coupon",
      required: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0.01,
    },

    minimumBookingAmount: {
      type: Number,
      min: 0,
    },

    maximumDiscountAmount: {
      type: Number,
      min: 0.01,
    },

    totalUsageLimit: {
      type: Number,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedUsageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    perUserUsageLimit: {
      type: Number,
      min: 1,
    },

    firstNTickets: {
      type: Number,
      min: 1,
    },

    discountedTicketsReserved: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountedTicketsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxTicketsPerBooking: {
      type: Number,
      min: 1,
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },

    visibility: {
      type: String,
      enum: ["public", "hidden"],
      default: "public",
    },

    displayText: {
      type: String,
      trim: true,
      maxlength: 160,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    minimumAmount: {
      type: Number,
      min: 0,
    },

    maximumDiscount: {
      type: Number,
      min: 0.01,
    },

    usageLimit: {
      type: Number,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index(
  {
    event: 1,
    code: 1,
  },
  {
    name: activeCouponCodeIndexName,
    unique: true,
    partialFilterExpression: {
      promotionMode: "coupon",
      isDeleted: false,
      code: {
        $type: "string",
      },
    },
  }
);

couponSchema.index({
  organizer: 1,
  createdAt: -1,
});

couponSchema.index({
  event: 1,
  promotionMode: 1,
  status: 1,
  visibility: 1,
  validFrom: 1,
  validUntil: 1,
});

couponSchema.index({
  event: 1,
  status: 1,
  validFrom: 1,
  validUntil: 1,
});

couponSchema.index({
  organizer: 1,
  status: 1,
  promotionMode: 1,
});

couponSchema.index({
  isDeleted: 1,
  status: 1,
});

const Promotion = mongoose.model<IPromotion>(
  "Coupon",
  couponSchema
);

const hasSingleAscendingKey = (
  index: PromotionIndexDescription,
  field: string
) => {
  const keyEntries = Object.entries(index.key);

  return (
    keyEntries.length === 1 &&
    keyEntries[0][0] === field &&
    keyEntries[0][1] === 1
  );
};

const hasAscendingKeys = (
  index: PromotionIndexDescription,
  fields: string[]
) => {
  const keyEntries = Object.entries(index.key);

  return (
    keyEntries.length === fields.length &&
    fields.every(
      (field, indexPosition) =>
        keyEntries[indexPosition][0] === field &&
        keyEntries[indexPosition][1] === 1
    )
  );
};

const isObsoleteCouponCodeIndex = (
  index: PromotionIndexDescription
) => {
  if (
    !index.unique ||
    index.name === activeCouponCodeIndexName
  ) {
    return false;
  }

  return (
    hasSingleAscendingKey(index, "code") ||
    hasSingleAscendingKey(index, "couponCode") ||
    hasAscendingKeys(index, ["event", "code"]) ||
    hasAscendingKeys(index, ["event", "couponCode"])
  );
};

export const ensurePromotionCouponIndexes = async () => {
  const legacyPromotionUpdate =
    await Promotion.updateMany(
      {
        isDeleted: {
          $exists: false,
        },
      },
      {
        $set: {
          isDeleted: false,
        },
      }
    );

  if (legacyPromotionUpdate.modifiedCount > 0) {
    console.log(
      `Marked ${legacyPromotionUpdate.modifiedCount} legacy promotions as non-deleted.`
    );
  }

  const indexes =
    (await Promotion.collection.indexes()) as PromotionIndexDescription[];

  const obsoleteIndexes = indexes.filter(
    isObsoleteCouponCodeIndex
  );

  for (const index of obsoleteIndexes) {
    if (index.name) {
      await Promotion.collection.dropIndex(index.name);
      console.log(
        `Removed obsolete promotion coupon-code index: ${index.name}`
      );
    }
  }

  await Promotion.createIndexes();
};

export default Promotion;

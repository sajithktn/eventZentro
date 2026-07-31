import mongoose, { Schema } from "mongoose";
import {
  ICommissionSetting,
} from "../interfaces/commission.interface";

const commissionSettingSchema =
  new Schema<ICommissionSetting>(
    {
      commissionPercentage: {
        type: Number,
        required: true,
        default: 10,
        min: 0,
        max: 100,
      },

      isActive: {
        type: Boolean,
        required: true,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<ICommissionSetting>(
  "CommissionSetting",
  commissionSettingSchema
);
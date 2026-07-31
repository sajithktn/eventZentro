import { Document } from "mongoose";

export interface ICommissionSetting extends Document {
  commissionPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
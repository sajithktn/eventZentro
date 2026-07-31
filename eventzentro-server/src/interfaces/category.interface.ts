import { Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
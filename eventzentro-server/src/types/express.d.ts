import type { IUser } from "../interfaces/user.interface";
import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface User extends IUser {
      id?: string | Types.ObjectId;
    }
  }
}

export {};

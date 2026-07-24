import type { IUser } from "../interfaces/user.interface";

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

export {};
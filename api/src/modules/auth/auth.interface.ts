import { Request } from "express";
import { IUser } from "../user/user.interface";

export interface AuthRequest extends Request {
  user: IUser;
}
import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import { ZodType } from "zod";

const validate = (schema: ZodType): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
};

export default validate;
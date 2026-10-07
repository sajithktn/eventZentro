import { z } from "zod";

export const updateAdminCommissionSchema =
  z.object({
    commissionPercentage: z
      .number({
        error:
          "Commission percentage must be a number",
      })
      .min(
        0,
        "Commission percentage cannot be less than 0"
      )
      .max(
        100,
        "Commission percentage cannot exceed 100"
      ),

    isActive: z.boolean({
      error: "Commission status must be a boolean",
    }),
  });

export type UpdateAdminCommissionInput =
  z.infer<
    typeof updateAdminCommissionSchema
  >;
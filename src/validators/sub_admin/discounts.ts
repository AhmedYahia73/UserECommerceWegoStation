import z from "zod";

export const createDiscountSchema = z.object({
  body: z.object({
    name: z.record(z.string()).refine((obj) => Object.keys(obj).length > 0 && Object.values(obj)[0]?.trim().length > 0, {
      message: "At least the primary language name is required",
    }),
    type: z.enum(["percentage", "value"]),
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)]),
    status: z.boolean().optional(),
  }),
});

export const updateDiscountSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Discount ID is required" }).uuid("Invalid discount ID"),
  }),
  body: z.object({
    name: z.record(z.string()).optional(),
    type: z.enum(["percentage", "value"]).optional(),
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
    status: z.boolean().optional(),
  }),
});

export const discountIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Discount ID is required" }).uuid("Invalid discount ID"),
  }),
});

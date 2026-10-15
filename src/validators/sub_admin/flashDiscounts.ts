import z from "zod";

export const createFlashDiscountSchema = z.object({
  body: z.object({
    name: z.record(z.string()).refine((obj) => Object.keys(obj).length > 0 && Object.values(obj)[0]?.trim().length > 0, {
      message: "At least the primary language name is required",
    }),
    type: z.enum(["percentage", "value"]),
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)]),
    status: z.boolean().optional(),
    start_date: z.string().datetime({ message: "start_date must be an ISO date string" }),
    end_date: z.string().datetime({ message: "end_date must be an ISO date string" }),
  }),
});

export const updateFlashDiscountSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Flash discount ID is required" }).uuid("Invalid flash discount ID"),
  }),
  body: z.object({
    name: z.record(z.string()).optional(),
    type: z.enum(["percentage", "value"]).optional(),
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
    status: z.boolean().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
});

export const flashDiscountIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Flash discount ID is required" }).uuid("Invalid flash discount ID"),
  }),
});

import z from "zod";

export const createTaxSchema = z.object({
  body: z.object({
    name: z.record(z.string()).refine((obj) => Object.keys(obj).length > 0 && Object.values(obj)[0]?.trim().length > 0, {
      message: "At least the primary language name is required",
    }),
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)]),
    type: z.enum(["percentage", "value"]),
    status: z.boolean().optional(),
  }),
});

export const updateTaxSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Tax ID is required" }).uuid("Invalid tax ID"),
  }),
  body: z.object({
    name: z.record(z.string()).optional(),
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
    type: z.enum(["percentage", "value"]).optional(),
    status: z.boolean().optional(),
  }),
});

export const taxIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Tax ID is required" }).uuid("Invalid tax ID"),
  }),
});

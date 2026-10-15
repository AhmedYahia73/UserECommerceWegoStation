import z from "zod";

export const createWarrantySchema = z.object({
  body: z.object({
    text: z.record(z.string()).refine((obj) => Object.keys(obj).length > 0 && Object.values(obj)[0]?.trim().length > 0, {
      message: "At least the primary language text is required",
    }),
    logo: z.string().optional().nullable(),
    period: z.string().optional().nullable(),
  }),
});

export const updateWarrantySchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Warranty ID is required" }).uuid("Invalid warranty ID"),
  }),
  body: z.object({
    text: z.record(z.string()).optional(),
    logo: z.string().optional().nullable(),
    period: z.string().optional().nullable(),
  }),
});

export const warrantyIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Warranty ID is required" }).uuid("Invalid warranty ID"),
  }),
});

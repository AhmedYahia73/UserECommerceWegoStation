import z from "zod";

export const createPaymentMethodSchema = z.object({
  body: z.object({
    name: z.array(z.string()).min(1, "At least one name is required"),
    description: z.string().optional().nullable(),
    icon: z.string({ required_error: "Icon image is required" }).min(1, "Icon image is required"),
    status: z.boolean().optional(),
  }),
});

export const updatePaymentMethodSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Payment method ID is required" }).uuid("Invalid payment method ID"),
  }),
  body: z.object({
    name: z.array(z.string()).min(1).optional(),
    description: z.string().optional().nullable(),
    icon: z.string().min(1).optional(),
    status: z.boolean().optional(),
  }),
});

export const paymentMethodIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Payment method ID is required" }).uuid("Invalid payment method ID"),
  }),
});

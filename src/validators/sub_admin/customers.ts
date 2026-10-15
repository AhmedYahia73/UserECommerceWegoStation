import z from "zod";

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(1, "Name is required"),
    phone: z.string({ required_error: "Phone is required" }).min(1, "Phone is required"),
    email: z.string({ required_error: "Email is required" }).email("Invalid email"),
    order_num: z.number().int().optional(),
    order_sum: z.number().int().optional(),
    image: z.string().optional().nullable(),
    password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters long"),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Customer ID is required" }).uuid("Invalid customer ID"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email("Invalid email").optional(),
    order_num: z.number().int().optional(),
    order_sum: z.number().int().optional(),
    image: z.string().optional().nullable(),
    password: z.string().min(6).optional(),
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Customer ID is required" }).uuid("Invalid customer ID"),
  }),
});

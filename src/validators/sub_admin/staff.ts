import z from "zod";

export const createStaffSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(1, "Name is required"),
    email: z.string({ required_error: "Email is required" }).email("Invalid email"),
    phone: z.string({ required_error: "Phone is required" }).min(1, "Phone is required"),
    password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters long"),
    role_id: z.string({ required_error: "Role ID is required" }).uuid("Invalid role ID"),
  }),
});

export const updateStaffSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Staff ID is required" }).uuid("Invalid staff ID"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().min(1).optional(),
    password: z.string().min(6).optional(),
    role_id: z.string().uuid().optional(),
  }),
});

export const staffIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Staff ID is required" }).uuid("Invalid staff ID"),
  }),
});

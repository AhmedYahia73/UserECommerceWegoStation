import z from "zod";

export const createAdminSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Admin name is required" }).min(1, "Admin name is required"),
    email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
    phone: z.string({ required_error: "Phone is required" }).min(1, "Phone is required"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters long"),
    role_id: z.string({ required_error: "Role ID is required" }).uuid("Invalid role ID"),
    status: z.boolean().optional().default(true),
  }),
});

export const updateAdminSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Admin ID is required" }).uuid("Invalid admin ID"),
  }),
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().min(1, "Phone cannot be empty").optional(),
    password: z.string().min(6, "Password must be at least 6 characters long").optional(),
    role_id: z.string().uuid("Invalid role ID").optional(),
    status: z.boolean().optional(),
  }),
});

export const adminIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Admin ID is required" }).uuid("Invalid admin ID"),
  }),
});

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
    password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
  }),
});

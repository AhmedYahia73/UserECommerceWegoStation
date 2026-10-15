import z from "zod";

export const permissionItemSchema = z.object({
  id: z.string().optional(),
  permission: z.string({ required_error: "Permission name is required" }).min(1, "Permission name cannot be empty"),
  actions: z
    .array(z.string().min(1, "Action cannot be empty"), {
      required_error: "Actions array is required",
    })
    .min(1, "At least one action is required"),
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Role name is required" }).min(1, "Role name is required"),
    permissions: z.array(permissionItemSchema).optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Role ID is required" }).min(1, "Role ID is required"),
  }),
  body: z.object({
    name: z.string().min(1, "Role name cannot be empty").optional(),
    permissions: z.array(permissionItemSchema).optional(),
  }),
});

export const roleIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Role ID is required" }).min(1, "Role ID is required"),
  }),
});

export const createPermissionSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Role ID is required" }).min(1, "Role ID is required"),
  }),
  body: z.object({
    permission: z.string({ required_error: "Permission name is required" }).min(1, "Permission name cannot be empty"),
    actions: z
      .array(z.string().min(1, "Action cannot be empty"), {
        required_error: "Actions array is required",
      })
      .min(1, "At least one action is required"),
  }),
});

export const updatePermissionSchema = z.object({
  params: z.object({
    permissionId: z.string({ required_error: "Permission ID is required" }).min(1, "Permission ID is required"),
  }),
  body: z.object({
    permission: z.string().min(1, "Permission name cannot be empty").optional(),
    actions: z
      .array(z.string().min(1, "Action cannot be empty"))
      .min(1, "At least one action is required")
      .optional(),
  }),
});

export const permissionIdParamSchema = z.object({
  params: z.object({
    permissionId: z.string({ required_error: "Permission ID is required" }).min(1, "Permission ID is required"),
  }),
});

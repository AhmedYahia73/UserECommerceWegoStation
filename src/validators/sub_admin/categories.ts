import z from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.record(z.string()).refine((obj) => Object.keys(obj).length > 0 && Object.values(obj)[0]?.trim().length > 0, {
      message: "At least the primary language name is required",
    }),
    category_id: z.string().uuid().optional().nullable(),
    order_number: z.number().int().optional(),
    banner: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    cover_image: z.string().optional().nullable(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Category ID is required" }).uuid("Invalid category ID"),
  }),
  body: z.object({
    name: z.record(z.string()).optional(),
    category_id: z.string().uuid().optional().nullable(),
    order_number: z.number().int().optional(),
    banner: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    cover_image: z.string().optional().nullable(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Category ID is required" }).uuid("Invalid category ID"),
  }),
});

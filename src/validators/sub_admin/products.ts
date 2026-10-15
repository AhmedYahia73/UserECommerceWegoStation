import z from "zod";

export const variantItemSchema = z.object({
  id: z.string().uuid().optional(),
  value_ids: z.array(z.string()).min(1, "At least one value ID is required"),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().default(1),
  price: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)]).default(0),
  image: z.string().optional().nullable(),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.record(z.string()).refine(
      (obj) => Object.keys(obj).length > 0 && Object.values(obj)[0]?.trim().length > 0,
      { message: "At least the primary language name is required" }
    ),
    description: z.record(z.string()).optional().nullable(),
    category_id: z.string({ required_error: "Category ID is required" }).uuid("Invalid category ID"),
    sub_category_id: z.string().uuid("Invalid sub category ID").optional().nullable(),
    brand_id: z.string().uuid("Invalid brand ID").optional().nullable(),
    discount_id: z.string().uuid("Invalid discount ID").optional().nullable(),
    flash_discount_id: z.string().uuid("Invalid flash discount ID").optional().nullable(),
    tax_id: z.string().uuid("Invalid tax ID").optional().nullable(),
    warrantly_id: z.string().uuid("Invalid warranty ID").optional().nullable(),
    warrantly_note: z.string().optional().nullable(),
    today_deal: z.boolean().optional(),
    free_shipping: z.boolean().optional(),
    shipping_days: z.number().int().optional(),
    published: z.boolean().optional(),
    image: z.string({ required_error: "Main product image is required" }).min(1, "Main product image is required"),
    gallery: z.array(z.string()).optional().nullable(),
    product_values: z.array(variantItemSchema).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Product ID is required" }).uuid("Invalid product ID"),
  }),
  body: z.object({
    name: z.record(z.string()).optional(),
    description: z.record(z.string()).optional().nullable(),
    category_id: z.string().uuid("Invalid category ID").optional(),
    sub_category_id: z.string().uuid("Invalid sub category ID").optional().nullable(),
    brand_id: z.string().uuid("Invalid brand ID").optional().nullable(),
    discount_id: z.string().uuid("Invalid discount ID").optional().nullable(),
    flash_discount_id: z.string().uuid("Invalid flash discount ID").optional().nullable(),
    tax_id: z.string().uuid("Invalid tax ID").optional().nullable(),
    warrantly_id: z.string().uuid("Invalid warranty ID").optional().nullable(),
    warrantly_note: z.string().optional().nullable(),
    today_deal: z.boolean().optional(),
    free_shipping: z.boolean().optional(),
    shipping_days: z.number().int().optional(),
    published: z.boolean().optional(),
    image: z.string().optional(),
    gallery: z.array(z.string()).optional().nullable(),
    product_values: z.array(variantItemSchema).optional(),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Product ID is required" }).uuid("Invalid product ID"),
  }),
});

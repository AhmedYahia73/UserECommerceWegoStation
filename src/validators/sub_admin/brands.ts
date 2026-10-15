import z from "zod";

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Brand name is required" }).min(1, "Brand name is required"),
    logo: z.string({ required_error: "Brand logo is required" }).min(1, "Brand logo is required"),
  }),
});

export const updateBrandSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Brand ID is required" }).uuid("Invalid brand ID"),
  }),
  body: z.object({
    name: z.string().min(1, "Brand name cannot be empty").optional(),
    logo: z.string().min(1).optional(),
  }),
});

export const brandIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Brand ID is required" }).uuid("Invalid brand ID"),
  }),
});

import z from "zod";

export const createLanguageSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(1, "Name is required"),
    status: z.boolean().optional(),
  }),
});

export const updateLanguageSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Language ID is required" }).uuid("Invalid language ID"),
  }),
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    status: z.boolean().optional(),
  }),
});

export const languageIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Language ID is required" }).uuid("Invalid language ID"),
  }),
});

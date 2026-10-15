import z from "zod";

const multilingualNameSchema = z
  .record(z.string(), z.string({ required_error: "Language translation must be a string" }))
  .refine(
    (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
    { message: "At least one language is required for name" }
  );

const optionalMultilingualSchema = z
  .record(z.string(), z.string())
  .optional()
  .nullable();

export const createPopupSchema = z.object({
  body: z.object({
    name: multilingualNameSchema,
    image: z
      .array(z.string().min(1, "Image string cannot be empty"), {
        required_error: "At least one image is required",
      })
      .min(1, "At least one image is required"),
    link: z.string().max(500, "Link cannot exceed 500 characters").optional().nullable(),
    description: optionalMultilingualSchema,
  }),
});

export const updatePopupSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Popup ID is required" }).min(1, "Popup ID is required"),
  }),
  body: z.object({
    name: multilingualNameSchema.optional(),
    image: z
      .array(z.string().min(1, "Image string cannot be empty"))
      .min(1, "Image array cannot be empty")
      .optional(),
    link: z.string().max(500, "Link cannot exceed 500 characters").optional().nullable(),
    description: optionalMultilingualSchema,
  }),
});

export const popupIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Popup ID is required" }).min(1, "Popup ID is required"),
  }),
});

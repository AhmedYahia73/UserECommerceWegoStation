import z from "zod";

const multilingualNameSchema = z
  .record(z.string(), z.string({ required_error: "Language translation must be a string" }))
  .refine(
    (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
    { message: "At least one language is required for name" }
  );

export const createAttributeSchema = z.object({
  body: z.object({
    name: multilingualNameSchema,
    values: z
      .array(
        z.object({
          name: multilingualNameSchema,
        })
      )
      .optional(),
  }),
});

export const updateAttributeSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Attribute ID is required" }).min(1, "Attribute ID is required"),
  }),
  body: z.object({
    name: multilingualNameSchema.optional(),
    values: z
      .array(
        z.object({
          id: z.string().optional(),
          name: multilingualNameSchema,
        })
      )
      .optional(),
  }),
});

export const attributeIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Attribute ID is required" }).min(1, "Attribute ID is required"),
  }),
});

export const createValueSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Attribute ID is required" }).min(1, "Attribute ID is required"),
  }),
  body: z.object({
    name: multilingualNameSchema,
  }),
});

export const updateValueSchema = z.object({
  params: z.object({
    valueId: z.string({ required_error: "Value ID is required" }).min(1, "Value ID is required"),
  }),
  body: z.object({
    name: multilingualNameSchema,
  }),
});

export const valueIdParamSchema = z.object({
  params: z.object({
    valueId: z.string({ required_error: "Value ID is required" }).min(1, "Value ID is required"),
  }),
});

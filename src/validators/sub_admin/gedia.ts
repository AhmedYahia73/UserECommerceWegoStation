import z from "zod";

const multilingualNameSchema = z.union([
  z.string().min(1, "Name is required").transform((val) => ({ en: val, ar: val })),
  z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
    { message: "At least one language is required for name" }
  ),
]);

export const createUpdateGediaSchema = z.object({
  body: z.object({
    name: multilingualNameSchema,
    logo: z.string().min(1).optional(),
    public_key: z.string({ required_error: "Public key is required" }).min(1, "Public key is required"),
    api_password: z.string({ required_error: "API password is required" }).min(1, "API password is required"),
    environment: z.enum(["egypt", "saudi_arabia", "uae"], {
      required_error: "Environment must be egypt, saudi_arabia, or uae",
    }).default("egypt"),
    status: z
      .preprocess((val) => (typeof val === "string" ? val === "true" || val === "1" : val), z.boolean())
      .default(true),
  }),
});

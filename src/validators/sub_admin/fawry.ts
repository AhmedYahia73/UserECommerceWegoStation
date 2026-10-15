import z from "zod";

const multilingualNameSchema = z.union([
  z.string().min(1, "Name is required").transform((val) => ({ en: val, ar: val })),
  z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
    { message: "At least one language is required for name" }
  ),
]);

export const createUpdateFawrySchema = z.object({
  body: z.object({
    name: multilingualNameSchema,
    logo: z.string().min(1).optional(),
    merchant_code: z.string().optional().nullable(),
    merchant_secret_key: z
      .string({ required_error: "Merchant secret key is required" })
      .min(1, "Merchant secret key is required"),
    fawry_base_url: z
      .enum(["Staging", "Live", "staging", "live"])
      .transform((val) => (val.toLowerCase() === "live" ? "Live" : "Staging"))
      .optional(),
    fawryBaseUrl: z
      .enum(["Staging", "Live", "staging", "live"])
      .transform((val) => (val.toLowerCase() === "live" ? "Live" : "Staging"))
      .optional(),
    status: z
      .preprocess((val) => (typeof val === "string" ? val === "true" || val === "1" : val), z.boolean())
      .default(true),
  }),
});

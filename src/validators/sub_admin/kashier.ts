import z from "zod";

const multilingualNameSchema = z.union([
  z.string().min(1, "Name is required").transform((val) => ({ en: val, ar: val })),
  z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
    { message: "At least one language is required for name" }
  ),
]);

export const createUpdateKashierSchema = z.object({
  body: z.object({
    name: multilingualNameSchema,
    logo: z.string().min(1).optional(),
    api_key: z.string({ required_error: "API key is required" }).min(1, "API key is required"),
    secret_key: z.string({ required_error: "Secret key is required" }).min(1, "Secret key is required"),
    merchant_id: z.string().min(1).optional(),
    merchent_id: z.string().min(1).optional(),
    status: z
      .preprocess((val) => (typeof val === "string" ? val === "true" || val === "1" : val), z.boolean())
      .default(true),
  }).refine((data) => data.merchant_id || data.merchent_id, {
    message: "merchant_id (or merchent_id) is required",
    path: ["merchant_id"],
  }),
});

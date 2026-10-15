import z from "zod";

const multilingualNameSchema = z.union([
  z.string().min(1, "Name is required").transform((val) => ({ en: val, ar: val })),
  z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
    { message: "At least one language is required for name" }
  ),
]);

export const createUpdatePaymobSchema = z.object({
  body: z.object({
    name: multilingualNameSchema,
    logo: z.string().min(1).optional(),
    api_key: z.string({ required_error: "API key is required" }).min(1, "API key is required"),
    iframe_id: z
      .union([z.string(), z.number().transform(String)])
      .optional(),
    iframid: z
      .union([z.string(), z.number().transform(String)])
      .optional(),
    integration_id: z
      .union([z.string(), z.number().transform(String)], {
        required_error: "Integration ID is required",
      }),
    hmac: z.string({ required_error: "HMAC is required" }).min(1, "HMAC is required"),
    type: z.enum(["test", "live"], { required_error: "Type must be test or live" }).default("test"),
    status: z
      .preprocess((val) => (typeof val === "string" ? val === "true" || val === "1" : val), z.boolean())
      .default(true),
  }).refine((data) => data.iframe_id || data.iframid, {
    message: "iframe_id (or iframid) is required",
    path: ["iframe_id"],
  }),
});

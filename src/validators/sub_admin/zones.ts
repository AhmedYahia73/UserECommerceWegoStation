import z from "zod";

export const createZoneSchema = z.object({
  body: z.object({
    name: z.array(z.string()).min(1, "At least one zone name is required"),
    city_id: z.string({ required_error: "City ID is required" }).uuid("Invalid city ID"),
    status: z.boolean().optional(),
  }),
});

export const updateZoneSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Zone ID is required" }).uuid("Invalid zone ID"),
  }),
  body: z.object({
    name: z.array(z.string()).min(1).optional(),
    city_id: z.string().uuid().optional(),
    status: z.boolean().optional(),
  }),
});

export const zoneIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Zone ID is required" }).uuid("Invalid zone ID"),
  }),
});

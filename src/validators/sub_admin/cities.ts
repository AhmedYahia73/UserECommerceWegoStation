import z from "zod";

export const createCitySchema = z.object({
  body: z.object({
    name: z.array(z.string()).min(1, "At least one city name is required"),
    status: z.boolean().optional(),
  }),
});

export const updateCitySchema = z.object({
  params: z.object({
    id: z.string({ required_error: "City ID is required" }).uuid("Invalid city ID"),
  }),
  body: z.object({
    name: z.array(z.string()).min(1).optional(),
    status: z.boolean().optional(),
  }),
});

export const cityIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "City ID is required" }).uuid("Invalid city ID"),
  }),
});

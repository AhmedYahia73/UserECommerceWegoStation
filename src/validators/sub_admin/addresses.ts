import z from "zod";

export const createAddressSchema = z.object({
  body: z.object({
    customer_id: z.string({ required_error: "Customer ID is required" }).uuid("Invalid customer ID"),
    city_id: z.string({ required_error: "City ID is required" }).uuid("Invalid city ID"),
    zone_id: z.string({ required_error: "Zone ID is required" }).uuid("Invalid zone ID"),
    building_num: z.string().optional().nullable(),
    floor: z.string().optional().nullable(),
    address: z.string({ required_error: "Address is required" }).min(1, "Address is required"),
    street: z.string().optional().nullable(),
    additional_data: z.string().optional().nullable(),
    lat: z.union([z.number(), z.string()]).optional().nullable(),
    lng: z.union([z.number(), z.string()]).optional().nullable(),
  }),
});

export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Address ID is required" }).uuid("Invalid address ID"),
  }),
  body: z.object({
    customer_id: z.string().uuid().optional(),
    city_id: z.string().uuid().optional(),
    zone_id: z.string().uuid().optional(),
    building_num: z.string().optional().nullable(),
    floor: z.string().optional().nullable(),
    address: z.string().min(1).optional(),
    street: z.string().optional().nullable(),
    additional_data: z.string().optional().nullable(),
    lat: z.union([z.number(), z.string()]).optional().nullable(),
    lng: z.union([z.number(), z.string()]).optional().nullable(),
  }),
});

export const addressIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Address ID is required" }).uuid("Invalid address ID"),
  }),
});

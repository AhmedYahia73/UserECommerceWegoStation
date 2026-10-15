import { Request, Response } from "express";
import { addresses, customers, cities, zones } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getGoogleMapsUrl } from "../../utils/localization";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllAddresses(req: Request, res: Response) {
  const db = req.db;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(addresses);
  const total = Number(countResult?.total || 0);

  const list = await db
    .select({
      id: addresses.id,
      customer_id: addresses.customer_id,
      customer_name: customers.name,
      city_id: addresses.city_id,
      zone_id: addresses.zone_id,
      building_num: addresses.building_num,
      floor: addresses.floor,
      address: addresses.address,
      street: addresses.street,
      additional_data: addresses.additional_data,
      lat: addresses.lat,
      lng: addresses.lng,
      createdAt: addresses.createdAt,
      updatedAt: addresses.updatedAt,
    })
    .from(addresses)
    .leftJoin(customers, eq(addresses.customer_id, customers.id))
    .limit(limit)
    .offset(offset);

  const formatted = list.map((item) => ({
    ...item,
    map_url: getGoogleMapsUrl(item.lat, item.lng),
  }));

  return SuccessResponse(
    res,
    {
      addresses: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// Relational Lists Endpoint for Creating / Editing Addresses
export async function getAddressLists(req: Request, res: Response) {
  const db = req.db;

  const customersList = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers);

  const citiesRaw = await db
    .select({ id: cities.id, name: cities.name })
    .from(cities)
    .where(eq(cities.status, true));
  const citiesList = citiesRaw.map((c) => ({
    id: c.id,
    name: Array.isArray(c.name) ? c.name[0] : c.name,
  }));

  const zonesRaw = await db
    .select({ id: zones.id, name: zones.name, city_id: zones.city_id })
    .from(zones)
    .where(eq(zones.status, true));
  const zonesList = zonesRaw.map((z) => ({
    id: z.id,
    name: Array.isArray(z.name) ? z.name[0] : z.name,
    city_id: z.city_id,
  }));

  return SuccessResponse(
    res,
    {
      customers: customersList,
      cities: citiesList,
      zones: zonesList,
    },
    200
  );
}

export async function getAddressById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const row = await db
    .select({
      id: addresses.id,
      customer_id: addresses.customer_id,
      customer_name: customers.name,
      city_id: addresses.city_id,
      zone_id: addresses.zone_id,
      building_num: addresses.building_num,
      floor: addresses.floor,
      address: addresses.address,
      street: addresses.street,
      additional_data: addresses.additional_data,
      lat: addresses.lat,
      lng: addresses.lng,
      createdAt: addresses.createdAt,
      updatedAt: addresses.updatedAt,
    })
    .from(addresses)
    .leftJoin(customers, eq(addresses.customer_id, customers.id))
    .where(eq(addresses.id, id))
    .limit(1);

  if (!row[0]) throw new NotFound("Address not found");

  const address = {
    ...row[0],
    map_url: getGoogleMapsUrl(row[0].lat, row[0].lng),
  };

  return SuccessResponse(res, { address }, 200);
}

export async function createAddress(req: Request, res: Response) {
  const db = req.db;
  const {
    customer_id,
    city_id,
    zone_id,
    building_num,
    floor,
    address,
    street,
    additional_data,
    lat,
    lng,
  } = req.body;

  const customerExists = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, customer_id)).limit(1);
  if (!customerExists[0]) throw new NotFound("Customer not found");

  const cityExists = await db.select({ id: cities.id }).from(cities).where(eq(cities.id, city_id)).limit(1);
  if (!cityExists[0]) throw new NotFound("City not found");

  const zoneExists = await db.select({ id: zones.id }).from(zones).where(eq(zones.id, zone_id)).limit(1);
  if (!zoneExists[0]) throw new NotFound("Zone not found");

  await db.insert(addresses).values({
    customer_id,
    city_id,
    zone_id,
    building_num: building_num ?? null,
    floor: floor ?? null,
    address,
    street: street ?? null,
    additional_data: additional_data ?? null,
    lat: lat !== undefined && lat !== null ? String(lat) : null,
    lng: lng !== undefined && lng !== null ? String(lng) : null,
  });

  return SuccessResponse(res, { message: "Address created successfully" }, 201);
}

export async function updateAddress(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const {
    customer_id,
    city_id,
    zone_id,
    building_num,
    floor,
    address,
    street,
    additional_data,
    lat,
    lng,
  } = req.body;

  const existing = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Address not found");

  if (customer_id) {
    const customerExists = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, customer_id)).limit(1);
    if (!customerExists[0]) throw new NotFound("Customer not found");
  }

  if (city_id) {
    const cityExists = await db.select({ id: cities.id }).from(cities).where(eq(cities.id, city_id)).limit(1);
    if (!cityExists[0]) throw new NotFound("City not found");
  }

  if (zone_id) {
    const zoneExists = await db.select({ id: zones.id }).from(zones).where(eq(zones.id, zone_id)).limit(1);
    if (!zoneExists[0]) throw new NotFound("Zone not found");
  }

  const updateData: Partial<typeof addresses.$inferInsert> = {};
  if (customer_id !== undefined) updateData.customer_id = customer_id;
  if (city_id !== undefined) updateData.city_id = city_id;
  if (zone_id !== undefined) updateData.zone_id = zone_id;
  if (building_num !== undefined) updateData.building_num = building_num;
  if (floor !== undefined) updateData.floor = floor;
  if (address !== undefined) updateData.address = address;
  if (street !== undefined) updateData.street = street;
  if (additional_data !== undefined) updateData.additional_data = additional_data;
  if (lat !== undefined) updateData.lat = lat !== null ? String(lat) : null;
  if (lng !== undefined) updateData.lng = lng !== null ? String(lng) : null;

  if (Object.keys(updateData).length > 0) {
    await db.update(addresses).set(updateData).where(eq(addresses.id, id));
  }

  return SuccessResponse(res, { message: "Address updated successfully" }, 200);
}

export async function deleteAddress(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Address not found");

  await db.delete(addresses).where(eq(addresses.id, id));
  return SuccessResponse(res, { message: "Address deleted successfully" }, 200);
}

export async function bulkDeleteAddresses(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(addresses).where(inArray(addresses.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching addresses found", deletedCount: 0 }, 200);
  }

  await db.delete(addresses).where(inArray(addresses.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} address(es) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

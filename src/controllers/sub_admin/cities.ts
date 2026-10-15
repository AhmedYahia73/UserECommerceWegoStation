import { Request, Response } from "express";
import { cities } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllCities(req: Request, res: Response) {
  const db = req.db;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(cities);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(cities).limit(limit).offset(offset);
  return SuccessResponse(
    res,
    {
      cities: list,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getCitiesSelection(req: Request, res: Response) {
  const db = req.db;
  const list = await db
    .select({
      id: cities.id,
      name: cities.name,
    })
    .from(cities)
    .where(eq(cities.status, true));

  const formatted = list.map((item) => ({
    id: item.id,
    name: Array.isArray(item.name) ? item.name[0] : item.name,
  }));

  return SuccessResponse(res, { cities: formatted }, 200);
}

export async function getCityById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const row = await db.select().from(cities).where(eq(cities.id, id)).limit(1);
  if (!row[0]) throw new NotFound("City not found");

  return SuccessResponse(res, { city: row[0] }, 200);
}

export async function createCity(req: Request, res: Response) {
  const db = req.db;
  const { name, status } = req.body;

  await db.insert(cities).values({
    name,
    status: status !== undefined ? status : true,
  });

  return SuccessResponse(res, { message: "City created successfully" }, 201);
}

export async function updateCity(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, status } = req.body;

  const existing = await db.select().from(cities).where(eq(cities.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("City not found");

  const updateData: Partial<typeof cities.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (status !== undefined) updateData.status = status;

  if (Object.keys(updateData).length > 0) {
    await db.update(cities).set(updateData).where(eq(cities.id, id));
  }

  return SuccessResponse(res, { message: "City updated successfully" }, 200);
}

export async function deleteCity(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(cities).where(eq(cities.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("City not found");

  await db.delete(cities).where(eq(cities.id, id));
  return SuccessResponse(res, { message: "City deleted successfully" }, 200);
}

export async function bulkDeleteCities(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(cities).where(inArray(cities.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching cities found", deletedCount: 0 }, 200);
  }

  await db.delete(cities).where(inArray(cities.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} city(ies) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

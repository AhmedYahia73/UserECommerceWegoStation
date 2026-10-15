import { Request, Response } from "express";
import { brands } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { uploadImage, updateImage, deleteImage } from "../../services/imageService";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllBrands(req: Request, res: Response) {
  const db = req.db;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(brands);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(brands).limit(limit).offset(offset);
  return SuccessResponse(
    res,
    {
      brands: list,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getBrandsSelection(req: Request, res: Response) {
  const db = req.db;
  const list = await db
    .select({
      id: brands.id,
      name: brands.name,
    })
    .from(brands);

  return SuccessResponse(res, { brands: list }, 200);
}

export async function getBrandById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const row = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Brand not found");

  return SuccessResponse(res, { brand: row[0] }, 200);
}

export async function createBrand(req: Request, res: Response) {
  const db = req.db;
  const { name, logo } = req.body;

  const logoUrl = await uploadImage(req, logo, "uploads");

  await db.insert(brands).values({
    name,
    logo: logoUrl,
  });

  return SuccessResponse(res, { message: "Brand created successfully" }, 201);
}

export async function updateBrand(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, logo } = req.body;

  const existing = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Brand not found");

  const updateData: Partial<typeof brands.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;

  if (logo !== undefined && logo !== existing[0].logo) {
    updateData.logo = await updateImage(req, logo, "uploads", existing[0].logo);
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(brands).set(updateData).where(eq(brands.id, id));
  }

  return SuccessResponse(res, { message: "Brand updated successfully" }, 200);
}

export async function deleteBrand(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Brand not found");

  await deleteImage(existing[0].logo);
  await db.delete(brands).where(eq(brands.id, id));

  return SuccessResponse(res, { message: "Brand deleted successfully" }, 200);
}

export async function bulkDeleteBrands(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(brands).where(inArray(brands.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching brands found", deletedCount: 0 }, 200);
  }

  for (const item of existing) {
    if (item.logo) {
      await deleteImage(item.logo);
    }
  }

  await db.delete(brands).where(inArray(brands.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} brand(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

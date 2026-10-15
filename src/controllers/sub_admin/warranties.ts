import { Request, Response } from "express";
import { warranties } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { uploadImage, updateImage, deleteImage } from "../../services/imageService";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllWarranties(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(warranties);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(warranties).limit(limit).offset(offset);
  const formatted = list.map((item) => ({
    ...item,
    text: getLocalizedText(item.text, lang),
    texts: item.text,
  }));

  return SuccessResponse(
    res,
    {
      warranties: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getWarrantiesSelection(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const list = await db
    .select({
      id: warranties.id,
      text: warranties.text,
    })
    .from(warranties);

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.text, lang),
  }));

  return SuccessResponse(res, { warranties: formatted }, 200);
}

export async function getWarrantyById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db.select().from(warranties).where(eq(warranties.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Warranty not found");

  const warranty = {
    ...row[0],
    localized_text: getLocalizedText(row[0].text, lang),
  };

  return SuccessResponse(res, { warranty }, 200);
}

export async function createWarranty(req: Request, res: Response) {
  const db = req.db;
  const { text, logo, period } = req.body;

  let logoUrl: string | null = null;
  if (logo) {
    logoUrl = await uploadImage(req, logo, "uploads");
  }

  await db.insert(warranties).values({
    text,
    logo: logoUrl,
    period: period ?? null,
  });

  return SuccessResponse(res, { message: "Warranty created successfully" }, 201);
}

export async function updateWarranty(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { text, logo, period } = req.body;

  const existing = await db.select().from(warranties).where(eq(warranties.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Warranty not found");

  const updateData: Partial<typeof warranties.$inferInsert> = {};
  if (text !== undefined) updateData.text = text;
  if (period !== undefined) updateData.period = period;

  if (logo !== undefined && logo !== existing[0].logo) {
    if (logo) {
      updateData.logo = await updateImage(req, logo, "uploads", existing[0].logo);
    } else {
      await deleteImage(existing[0].logo);
      updateData.logo = null;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(warranties).set(updateData).where(eq(warranties.id, id));
  }

  return SuccessResponse(res, { message: "Warranty updated successfully" }, 200);
}

export async function deleteWarranty(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(warranties).where(eq(warranties.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Warranty not found");

  if (existing[0].logo) {
    await deleteImage(existing[0].logo);
  }

  await db.delete(warranties).where(eq(warranties.id, id));
  return SuccessResponse(res, { message: "Warranty deleted successfully" }, 200);
}

export async function bulkDeleteWarranties(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(warranties).where(inArray(warranties.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching warranties found", deletedCount: 0 }, 200);
  }

  for (const item of existing) {
    if (item.logo) {
      await deleteImage(item.logo);
    }
  }

  await db.delete(warranties).where(inArray(warranties.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} warranty(ies) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

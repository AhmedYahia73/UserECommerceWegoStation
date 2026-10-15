import { Request, Response } from "express";
import { languages } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllLanguages(req: Request, res: Response) {
  const db = req.db;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(languages);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(languages).limit(limit).offset(offset);
  return SuccessResponse(
    res,
    {
      languages: list,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getLanguagesSelection(req: Request, res: Response) {
  const db = req.db;
  const list = await db
    .select({
      id: languages.id,
      name: languages.name,
    })
    .from(languages)
    .where(eq(languages.status, true));

  return SuccessResponse(res, { languages: list }, 200);
}

export async function getLanguageById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const row = await db.select().from(languages).where(eq(languages.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Language not found");

  return SuccessResponse(res, { language: row[0] }, 200);
}

export async function createLanguage(req: Request, res: Response) {
  const db = req.db;
  const { name, status } = req.body;

  await db.insert(languages).values({
    name,
    status: status !== undefined ? status : true,
  });

  return SuccessResponse(res, { message: "Language created successfully" }, 201);
}

export async function updateLanguage(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, status } = req.body;

  const existing = await db.select().from(languages).where(eq(languages.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Language not found");

  const updateData: Partial<typeof languages.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (status !== undefined) updateData.status = status;

  if (Object.keys(updateData).length > 0) {
    await db.update(languages).set(updateData).where(eq(languages.id, id));
  }

  return SuccessResponse(res, { message: "Language updated successfully" }, 200);
}

export async function deleteLanguage(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(languages).where(eq(languages.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Language not found");

  await db.delete(languages).where(eq(languages.id, id));
  return SuccessResponse(res, { message: "Language deleted successfully" }, 200);
}

export async function bulkDeleteLanguages(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(languages).where(inArray(languages.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching languages found", deletedCount: 0 }, 200);
  }

  await db.delete(languages).where(inArray(languages.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} language(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

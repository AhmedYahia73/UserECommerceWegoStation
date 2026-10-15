import { Request, Response } from "express";
import { taxes } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllTaxes(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(taxes);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(taxes).limit(limit).offset(offset);
  const formatted = list.map((item) => ({
    ...item,
    name: getLocalizedText(item.name, lang),
    names: item.name,
  }));

  return SuccessResponse(
    res,
    {
      taxes: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getTaxesSelection(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const list = await db
    .select({
      id: taxes.id,
      name: taxes.name,
    })
    .from(taxes)
    .where(eq(taxes.status, true));

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
  }));

  return SuccessResponse(res, { taxes: formatted }, 200);
}

export async function getTaxById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db.select().from(taxes).where(eq(taxes.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Tax not found");

  const tax = {
    ...row[0],
    localized_name: getLocalizedText(row[0].name, lang),
  };

  return SuccessResponse(res, { tax }, 200);
}

export async function createTax(req: Request, res: Response) {
  const db = req.db;
  const { name, amount, type, status } = req.body;

  await db.insert(taxes).values({
    name,
    amount: String(amount),
    type,
    status: status !== undefined ? status : true,
  });

  return SuccessResponse(res, { message: "Tax created successfully" }, 201);
}

export async function updateTax(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, amount, type, status } = req.body;

  const existing = await db.select().from(taxes).where(eq(taxes.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Tax not found");

  const updateData: Partial<typeof taxes.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (amount !== undefined) updateData.amount = String(amount);
  if (type !== undefined) updateData.type = type;
  if (status !== undefined) updateData.status = status;

  if (Object.keys(updateData).length > 0) {
    await db.update(taxes).set(updateData).where(eq(taxes.id, id));
  }

  return SuccessResponse(res, { message: "Tax updated successfully" }, 200);
}

export async function deleteTax(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(taxes).where(eq(taxes.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Tax not found");

  await db.delete(taxes).where(eq(taxes.id, id));
  return SuccessResponse(res, { message: "Tax deleted successfully" }, 200);
}

export async function bulkDeleteTaxes(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(taxes).where(inArray(taxes.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching taxes found", deletedCount: 0 }, 200);
  }

  await db.delete(taxes).where(inArray(taxes.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} tax(es) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

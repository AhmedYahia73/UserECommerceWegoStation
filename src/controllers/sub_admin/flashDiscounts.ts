import { Request, Response } from "express";
import { flashDiscounts } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllFlashDiscounts(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(flashDiscounts);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(flashDiscounts).limit(limit).offset(offset);
  const formatted = list.map((item) => ({
    ...item,
    name: getLocalizedText(item.name, lang),
    names: item.name,
  }));

  return SuccessResponse(
    res,
    {
      flash_discounts: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getFlashDiscountsSelection(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const list = await db
    .select({
      id: flashDiscounts.id,
      name: flashDiscounts.name,
    })
    .from(flashDiscounts)
    .where(eq(flashDiscounts.status, true));

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
  }));

  return SuccessResponse(res, { flashDiscounts: formatted }, 200);
}

export async function getFlashDiscountById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db.select().from(flashDiscounts).where(eq(flashDiscounts.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Flash discount not found");

  const flashDiscount = {
    ...row[0],
    localized_name: getLocalizedText(row[0].name, lang),
  };

  return SuccessResponse(res, { flashDiscount }, 200);
}

export async function createFlashDiscount(req: Request, res: Response) {
  const db = req.db;
  const { name, type, amount, status, start_date, end_date } = req.body;

  await db.insert(flashDiscounts).values({
    name,
    type,
    amount: String(amount),
    status: status !== undefined ? status : true,
    start_date: new Date(start_date),
    end_date: new Date(end_date),
  });

  return SuccessResponse(res, { message: "Flash discount created successfully" }, 201);
}

export async function updateFlashDiscount(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, type, amount, status, start_date, end_date } = req.body;

  const existing = await db.select().from(flashDiscounts).where(eq(flashDiscounts.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Flash discount not found");

  const updateData: Partial<typeof flashDiscounts.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (amount !== undefined) updateData.amount = String(amount);
  if (status !== undefined) updateData.status = status;
  if (start_date !== undefined) updateData.start_date = new Date(start_date);
  if (end_date !== undefined) updateData.end_date = new Date(end_date);

  if (Object.keys(updateData).length > 0) {
    await db.update(flashDiscounts).set(updateData).where(eq(flashDiscounts.id, id));
  }

  return SuccessResponse(res, { message: "Flash discount updated successfully" }, 200);
}

export async function deleteFlashDiscount(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(flashDiscounts).where(eq(flashDiscounts.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Flash discount not found");

  await db.delete(flashDiscounts).where(eq(flashDiscounts.id, id));
  return SuccessResponse(res, { message: "Flash discount deleted successfully" }, 200);
}

export async function bulkDeleteFlashDiscounts(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(flashDiscounts).where(inArray(flashDiscounts.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching flash discounts found", deletedCount: 0 }, 200);
  }

  await db.delete(flashDiscounts).where(inArray(flashDiscounts.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} flash discount(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

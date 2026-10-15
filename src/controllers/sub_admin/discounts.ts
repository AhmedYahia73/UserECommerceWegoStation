import { Request, Response } from "express";
import { discounts } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllDiscounts(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(discounts);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(discounts).limit(limit).offset(offset);
  const formatted = list.map((item) => ({
    ...item,
    name: getLocalizedText(item.name, lang),
    names: item.name,
  }));

  return SuccessResponse(
    res,
    {
      discounts: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getDiscountsSelection(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const list = await db
    .select({
      id: discounts.id,
      name: discounts.name,
    })
    .from(discounts)
    .where(eq(discounts.status, true));

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
  }));

  return SuccessResponse(res, { discounts: formatted }, 200);
}

export async function getDiscountById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Discount not found");

  const discount = {
    ...row[0],
    localized_name: getLocalizedText(row[0].name, lang),
  };

  return SuccessResponse(res, { discount }, 200);
}

export async function createDiscount(req: Request, res: Response) {
  const db = req.db;
  const { name, type, amount, status } = req.body;

  await db.insert(discounts).values({
    name,
    type,
    amount: String(amount),
    status: status !== undefined ? status : true,
  });

  return SuccessResponse(res, { message: "Discount created successfully" }, 201);
}

export async function updateDiscount(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, type, amount, status } = req.body;

  const existing = await db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Discount not found");

  const updateData: Partial<typeof discounts.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (amount !== undefined) updateData.amount = String(amount);
  if (status !== undefined) updateData.status = status;

  if (Object.keys(updateData).length > 0) {
    await db.update(discounts).set(updateData).where(eq(discounts.id, id));
  }

  return SuccessResponse(res, { message: "Discount updated successfully" }, 200);
}

export async function deleteDiscount(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Discount not found");

  await db.delete(discounts).where(eq(discounts.id, id));
  return SuccessResponse(res, { message: "Discount deleted successfully" }, 200);
}

export async function bulkDeleteDiscounts(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(discounts).where(inArray(discounts.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching discounts found", deletedCount: 0 }, 200);
  }

  await db.delete(discounts).where(inArray(discounts.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} discount(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

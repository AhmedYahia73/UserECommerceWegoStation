import { Request, Response } from "express";
import { paymentMethods } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { uploadImage, updateImage, deleteImage } from "../../services/imageService";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllPaymentMethods(req: Request, res: Response) {
  const db = req.db;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(paymentMethods);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(paymentMethods).limit(limit).offset(offset);
  return SuccessResponse(
    res,
    {
      payment_methods: list,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getPaymentMethodsSelection(req: Request, res: Response) {
  const db = req.db;
  const list = await db
    .select({
      id: paymentMethods.id,
      name: paymentMethods.name,
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.status, true));

  const formatted = list.map((item) => ({
    id: item.id,
    name: Array.isArray(item.name) ? item.name[0] : item.name,
  }));

  return SuccessResponse(res, { paymentMethods: formatted }, 200);
}

export async function getPaymentMethodById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const row = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Payment method not found");

  return SuccessResponse(res, { paymentMethod: row[0] }, 200);
}

export async function createPaymentMethod(req: Request, res: Response) {
  const db = req.db;
  const { name, description, icon, status } = req.body;

  const iconUrl = await uploadImage(req, icon, "uploads");

  await db.insert(paymentMethods).values({
    name,
    description: description ?? null,
    icon: iconUrl,
    status: status !== undefined ? status : true,
  });

  return SuccessResponse(res, { message: "Payment method created successfully" }, 201);
}

export async function updatePaymentMethod(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, description, icon, status } = req.body;

  const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Payment method not found");

  const updateData: Partial<typeof paymentMethods.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;

  if (icon !== undefined && icon !== existing[0].icon) {
    updateData.icon = await updateImage(req, icon, "uploads", existing[0].icon);
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(paymentMethods).set(updateData).where(eq(paymentMethods.id, id));
  }

  return SuccessResponse(res, { message: "Payment method updated successfully" }, 200);
}

export async function deletePaymentMethod(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Payment method not found");

  await deleteImage(existing[0].icon);
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));

  return SuccessResponse(res, { message: "Payment method deleted successfully" }, 200);
}

export async function bulkDeletePaymentMethods(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(paymentMethods).where(inArray(paymentMethods.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching payment methods found", deletedCount: 0 }, 200);
  }

  for (const item of existing) {
    if (item.icon) {
      await deleteImage(item.icon);
    }
  }

  await db.delete(paymentMethods).where(inArray(paymentMethods.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} payment method(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

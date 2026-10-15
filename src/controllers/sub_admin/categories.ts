import { Request, Response } from "express";
import { categories } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { uploadImage, updateImage, deleteImage } from "../../services/imageService";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllCategories(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(categories);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(categories).limit(limit).offset(offset);
  const formatted = list.map((item) => ({
    ...item,
    name: getLocalizedText(item.name, lang),
    names: item.name,
  }));

  return SuccessResponse(
    res,
    {
      categories: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getCategoriesSelection(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const list = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories);

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
  }));

  return SuccessResponse(res, { categories: formatted }, 200);
}

export async function getCategoryById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Category not found");

  const category = {
    ...row[0],
    localized_name: getLocalizedText(row[0].name, lang),
  };

  return SuccessResponse(res, { category }, 200);
}

export async function createCategory(req: Request, res: Response) {
  const db = req.db;
  const { name, category_id, order_number, banner, icon, cover_image } = req.body;

  let bannerUrl: string | null = null;
  let iconUrl: string | null = null;
  let coverImageUrl: string | null = null;

  if (banner) bannerUrl = await uploadImage(req, banner, "uploads");
  if (icon) iconUrl = await uploadImage(req, icon, "uploads");
  if (cover_image) coverImageUrl = await uploadImage(req, cover_image, "uploads");

  await db.insert(categories).values({
    name,
    category_id: category_id ?? null,
    order_number: order_number ?? 0,
    banner: bannerUrl,
    icon: iconUrl,
    cover_image: coverImageUrl,
  });

  return SuccessResponse(res, { message: "Category created successfully" }, 201);
}

export async function updateCategory(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, category_id, order_number, banner, icon, cover_image } = req.body;

  const existing = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Category not found");

  const updateData: Partial<typeof categories.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (category_id !== undefined) updateData.category_id = category_id;
  if (order_number !== undefined) updateData.order_number = order_number;

  if (banner !== undefined && banner !== existing[0].banner) {
    if (banner) {
      updateData.banner = await updateImage(req, banner, "uploads", existing[0].banner);
    } else {
      await deleteImage(existing[0].banner);
      updateData.banner = null;
    }
  }

  if (icon !== undefined && icon !== existing[0].icon) {
    if (icon) {
      updateData.icon = await updateImage(req, icon, "uploads", existing[0].icon);
    } else {
      await deleteImage(existing[0].icon);
      updateData.icon = null;
    }
  }

  if (cover_image !== undefined && cover_image !== existing[0].cover_image) {
    if (cover_image) {
      updateData.cover_image = await updateImage(req, cover_image, "uploads", existing[0].cover_image);
    } else {
      await deleteImage(existing[0].cover_image);
      updateData.cover_image = null;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(categories).set(updateData).where(eq(categories.id, id));
  }

  return SuccessResponse(res, { message: "Category updated successfully" }, 200);
}

export async function deleteCategory(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Category not found");

  if (existing[0].banner) await deleteImage(existing[0].banner);
  if (existing[0].icon) await deleteImage(existing[0].icon);
  if (existing[0].cover_image) await deleteImage(existing[0].cover_image);

  await db.delete(categories).where(eq(categories.id, id));
  return SuccessResponse(res, { message: "Category deleted successfully" }, 200);
}

export async function bulkDeleteCategories(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(categories).where(inArray(categories.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching categories found", deletedCount: 0 }, 200);
  }

  for (const item of existing) {
    if (item.banner) await deleteImage(item.banner);
    if (item.icon) await deleteImage(item.icon);
    if (item.cover_image) await deleteImage(item.cover_image);
  }

  await db.delete(categories).where(inArray(categories.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} category(ies) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

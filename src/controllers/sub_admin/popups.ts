import { Request, Response } from "express";
import { popups } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { uploadImage, deleteImage } from "../../services/imageService";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

function formatImageUrl(req: Request, img: string): string {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const cleanPath = img.startsWith("/") ? img.slice(1) : img;
  return `${req.protocol}://${req.get("host")}/${cleanPath}`;
}

function parseImages(raw: any, req: Request): string[] {
  let list: string[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
      else if (typeof parsed === "string") list = [parsed];
    } catch {
      list = [raw];
    }
  }
  return list.map((img) => formatImageUrl(req, img));
}

// 1. Get All Popups (Paginated, images as links, multilingual names)
export async function getAllPopups(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(popups);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(popups).limit(limit).offset(offset);

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
    names: item.name,
    image: parseImages(item.image, req),
    link: item.link,
    description: item.description ? getLocalizedText(item.description, lang) : null,
    descriptions: item.description ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return SuccessResponse(
    res,
    {
      popups: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Get Popups Selection for Dropdowns (id, name)
export async function getPopupsSelection(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const list = await db
    .select({
      id: popups.id,
      name: popups.name,
    })
    .from(popups);

  const formatted = list.map((item) => ({
    id: item.id,
    name: getLocalizedText(item.name, lang),
  }));

  return SuccessResponse(res, { popups: formatted }, 200);
}

// 3. Get Popup By ID
export async function getPopupById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db.select().from(popups).where(eq(popups.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Popup not found");

  const formatted = {
    id: row[0].id,
    name: getLocalizedText(row[0].name, lang),
    names: row[0].name,
    image: parseImages(row[0].image, req),
    link: row[0].link,
    description: row[0].description ? getLocalizedText(row[0].description, lang) : null,
    descriptions: row[0].description ?? null,
    createdAt: row[0].createdAt,
    updatedAt: row[0].updatedAt,
  };

  return SuccessResponse(res, { popup: formatted }, 200);
}

// 4. Create Popup (multilingual name & description, base64 images array to full links)
export async function createPopup(req: Request, res: Response) {
  const db = req.db;
  const { name, image, link, description } = req.body;

  // Upload base64 images into uploads/ and collect URLs
  const imageUrls: string[] = await Promise.all(
    (image as string[]).map(async (img: string) => {
      if (img.startsWith("http://") || img.startsWith("https://")) return img;
      return await uploadImage(req, img, "uploads");
    })
  );

  const popupId = randomUUID();

  await db.insert(popups).values({
    id: popupId,
    name,
    image: imageUrls,
    link: link ?? null,
    description: description ?? null,
  });

  const created = await db.select().from(popups).where(eq(popups.id, popupId)).limit(1);

  return SuccessResponse(
    res,
    {
      message: "Popup created successfully",
      popup: {
        id: created[0].id,
        name: created[0].name,
        image: parseImages(created[0].image, req),
        link: created[0].link,
        description: created[0].description,
        createdAt: created[0].createdAt,
        updatedAt: created[0].updatedAt,
      },
    },
    201
  );
}

// 5. Update Popup (sync image array, remove unused photos, update multilingual fields)
export async function updatePopup(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, image, link, description } = req.body;

  const existing = await db.select().from(popups).where(eq(popups.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Popup not found");

  const updateData: Partial<typeof popups.$inferInsert> = {};

  if (name !== undefined) updateData.name = name;
  if (link !== undefined) updateData.link = link;
  if (description !== undefined) updateData.description = description;

  // Sync images array if provided
  if (image !== undefined) {
    const oldImages: string[] = Array.isArray(existing[0].image)
      ? (existing[0].image as string[])
      : [];
    const newImageList = Array.isArray(image) ? (image as string[]) : [];

    // Delete photos removed from old image list
    for (const oldUrl of oldImages) {
      if (!newImageList.includes(oldUrl)) {
        await deleteImage(oldUrl);
      }
    }

    // Upload any new base64 photos in new image list
    const resolvedUrls = await Promise.all(
      newImageList.map(async (img: string) => {
        if (img.startsWith("http://") || img.startsWith("https://")) return img;
        return await uploadImage(req, img, "uploads");
      })
    );

    updateData.image = resolvedUrls;
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(popups).set(updateData).where(eq(popups.id, id));
  }

  const updated = await db.select().from(popups).where(eq(popups.id, id)).limit(1);

  return SuccessResponse(
    res,
    {
      message: "Popup updated successfully",
      popup: {
        id: updated[0].id,
        name: updated[0].name,
        image: parseImages(updated[0].image, req),
        link: updated[0].link,
        description: updated[0].description,
        createdAt: updated[0].createdAt,
        updatedAt: updated[0].updatedAt,
      },
    },
    200
  );
}

// 6. Delete Popup (clean up all photos from uploads first)
export async function deletePopup(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(popups).where(eq(popups.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Popup not found");

  // Delete all photos from disk first
  const images: string[] = Array.isArray(existing[0].image)
    ? (existing[0].image as string[])
    : [];
  for (const imgUrl of images) {
    await deleteImage(imgUrl);
  }

  await db.delete(popups).where(eq(popups.id, id));

  return SuccessResponse(res, { message: "Popup deleted successfully" }, 200);
}

// 7. Bulk Delete Popups (clean up all photos across all matching popups first)
export async function bulkDeletePopups(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(popups).where(inArray(popups.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching popups found", deletedCount: 0 }, 200);
  }

  // Delete all photos from disk first across all matching popups
  for (const item of existing) {
    const images: string[] = Array.isArray(item.image) ? (item.image as string[]) : [];
    for (const imgUrl of images) {
      await deleteImage(imgUrl);
    }
  }

  const popupIds = existing.map((p) => p.id);
  await db.delete(popups).where(inArray(popups.id, popupIds));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} popup(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

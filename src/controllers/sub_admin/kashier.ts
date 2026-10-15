import { Request, Response } from "express";
import { kashier } from "../../models/schema";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { uploadImage, updateImage } from "../../services/imageService";

// 1. View Kashier Configuration (Returns single record)
export async function getKashier(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const rows = await db.select().from(kashier).limit(1);
  const host = req.get("host") || `${req.subdomain}.domain.com`;
  const fullCallbackUrl = `${req.protocol}://${host}/api/kashier_callback`;

  if (!rows[0]) {
    return SuccessResponse(
      res,
      {
        kashier: null,
        callback_url: `${req.subdomain}/api/kashier_callback`,
        full_callback_url: fullCallbackUrl,
      },
      200
    );
  }

  const item = rows[0];
  const callbackUrl = (item.callback_url || "{subdomain}/api/kashier_callback").replace(
    "{subdomain}",
    req.subdomain
  );

  const formatted = {
    ...item,
    name: getLocalizedText(item.name, lang),
    names: item.name,
    callback_url: callbackUrl,
    full_callback_url: fullCallbackUrl,
  };

  return SuccessResponse(res, { kashier: formatted }, 200);
}

// 2. Create or Update Kashier Configuration (Upsert)
export async function createOrUpdateKashier(req: Request, res: Response) {
  const db = req.db;
  const { name, api_key, secret_key, status } = req.body;
  const merchantId = req.body.merchant_id || req.body.merchent_id;
  const logoInput = req.file || req.body.logo;

  const existing = await db.select().from(kashier).limit(1);

  if (existing[0]) {
    // Update existing record
    const updateData: Partial<typeof kashier.$inferInsert> = {};

    if (name !== undefined) updateData.name = name;
    if (api_key !== undefined) updateData.api_key = api_key;
    if (secret_key !== undefined) updateData.secret_key = secret_key;
    if (merchantId !== undefined) updateData.merchant_id = String(merchantId);
    if (status !== undefined) updateData.status = Boolean(status);

    if (logoInput) {
      updateData.logo = await updateImage(req, logoInput, "uploads", existing[0].logo);
    }

    await db.update(kashier).set(updateData).where(eq(kashier.id, existing[0].id));

    const updated = await db.select().from(kashier).where(eq(kashier.id, existing[0].id)).limit(1);
    const callbackUrl = (updated[0].callback_url || "{subdomain}/api/kashier_callback").replace(
      "{subdomain}",
      req.subdomain
    );

    return SuccessResponse(
      res,
      {
        message: "Kashier settings updated successfully",
        kashier: {
          ...updated[0],
          callback_url: callbackUrl,
        },
      },
      200
    );
  } else {
    // Create new record
    if (!logoInput) {
      throw new BadRequest("Logo image is required");
    }

    const logoUrl = await uploadImage(req, logoInput, "uploads");
    const callbackUrl = `${req.subdomain}/api/kashier_callback`;

    await db.insert(kashier).values({
      name,
      logo: logoUrl,
      api_key,
      secret_key,
      merchant_id: String(merchantId),
      status: status !== undefined ? Boolean(status) : true,
      callback_url: callbackUrl,
    });

    const created = await db.select().from(kashier).limit(1);

    return SuccessResponse(
      res,
      {
        message: "Kashier settings created successfully",
        kashier: {
          ...created[0],
          callback_url: callbackUrl,
        },
      },
      201
    );
  }
}

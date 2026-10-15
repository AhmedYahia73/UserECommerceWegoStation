import { Request, Response } from "express";
import { paymob } from "../../models/schema";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { uploadImage, updateImage } from "../../services/imageService";

// 1. View Paymob Configuration (Returns single record)
export async function getPaymob(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const rows = await db.select().from(paymob).limit(1);
  const host = req.get("host") || `${req.subdomain}.domain.com`;
  const fullCallbackUrl = `${req.protocol}://${host}/api/paymob_callback`;

  if (!rows[0]) {
    return SuccessResponse(
      res,
      {
        paymob: null,
        callback_url: `${req.subdomain}/api/paymob_callback`,
        full_callback_url: fullCallbackUrl,
      },
      200
    );
  }

  const item = rows[0];
  const callbackUrl = (item.callback_url || "{subdomain}/api/paymob_callback").replace(
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

  return SuccessResponse(res, { paymob: formatted }, 200);
}

// 2. Create or Update Paymob Configuration (Upsert)
export async function createOrUpdatePaymob(req: Request, res: Response) {
  const db = req.db;
  const { name, api_key, integration_id, hmac, type, status } = req.body;
  const iframeId = req.body.iframe_id || req.body.iframid;
  const logoInput = req.file || req.body.logo;

  const existing = await db.select().from(paymob).limit(1);

  if (existing[0]) {
    // Update existing record
    const updateData: Partial<typeof paymob.$inferInsert> = {};

    if (name !== undefined) updateData.name = name;
    if (api_key !== undefined) updateData.api_key = api_key;
    if (iframeId !== undefined) updateData.iframe_id = String(iframeId);
    if (integration_id !== undefined) updateData.integration_id = String(integration_id);
    if (hmac !== undefined) updateData.hmac = hmac;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = Boolean(status);

    if (logoInput) {
      updateData.logo = await updateImage(req, logoInput, "uploads", existing[0].logo);
    }

    await db.update(paymob).set(updateData).where(eq(paymob.id, existing[0].id));

    const updated = await db.select().from(paymob).where(eq(paymob.id, existing[0].id)).limit(1);
    const callbackUrl = (updated[0].callback_url || "{subdomain}/api/paymob_callback").replace(
      "{subdomain}",
      req.subdomain
    );

    return SuccessResponse(
      res,
      {
        message: "Paymob settings updated successfully",
        paymob: {
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
    const callbackUrl = `${req.subdomain}/api/paymob_callback`;

    await db.insert(paymob).values({
      name,
      logo: logoUrl,
      api_key,
      iframe_id: String(iframeId),
      integration_id: String(integration_id),
      hmac,
      type: type || "test",
      status: status !== undefined ? Boolean(status) : true,
      callback_url: callbackUrl,
    });

    const created = await db.select().from(paymob).limit(1);

    return SuccessResponse(
      res,
      {
        message: "Paymob settings created successfully",
        paymob: {
          ...created[0],
          callback_url: callbackUrl,
        },
      },
      201
    );
  }
}

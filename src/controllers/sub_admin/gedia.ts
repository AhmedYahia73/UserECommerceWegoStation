import { Request, Response } from "express";
import { gedia } from "../../models/schema";
import { eq } from "drizzle-orm";
import { BadRequest } from "../../Errors/BadRequest";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { uploadImage, updateImage } from "../../services/imageService";

// 1. View Gedia Configuration (Returns single record)
export async function getGedia(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const rows = await db.select().from(gedia).limit(1);
  const host = req.get("host") || `${req.subdomain}.domain.com`;
  const fullCallbackUrl = `${req.protocol}://${host}/api/gedia_callback`;

  if (!rows[0]) {
    return SuccessResponse(
      res,
      {
        gedia: null,
        callback_url: `${req.subdomain}/api/gedia_callback`,
        full_callback_url: fullCallbackUrl,
      },
      200
    );
  }

  const item = rows[0];
  const callbackUrl = (item.callback_url || "{subdomain}/api/gedia_callback").replace(
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

  return SuccessResponse(res, { gedia: formatted }, 200);
}

// 2. Create or Update Gedia Configuration (Upsert)
export async function createOrUpdateGedia(req: Request, res: Response) {
  const db = req.db;
  const { name, public_key, api_password, environment, status } = req.body;
  const logoInput = req.file || req.body.logo;

  const existing = await db.select().from(gedia).limit(1);

  if (existing[0]) {
    // Update existing record
    const updateData: Partial<typeof gedia.$inferInsert> = {};

    if (name !== undefined) updateData.name = name;
    if (public_key !== undefined) updateData.public_key = public_key;
    if (api_password !== undefined) updateData.api_password = api_password;
    if (environment !== undefined) updateData.environment = environment;
    if (status !== undefined) updateData.status = Boolean(status);

    if (logoInput) {
      updateData.logo = await updateImage(req, logoInput, "uploads", existing[0].logo);
    }

    await db.update(gedia).set(updateData).where(eq(gedia.id, existing[0].id));

    const updated = await db.select().from(gedia).where(eq(gedia.id, existing[0].id)).limit(1);
    const callbackUrl = (updated[0].callback_url || "{subdomain}/api/gedia_callback").replace(
      "{subdomain}",
      req.subdomain
    );

    return SuccessResponse(
      res,
      {
        message: "Gedia settings updated successfully",
        gedia: {
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
    const callbackUrl = `${req.subdomain}/api/gedia_callback`;

    await db.insert(gedia).values({
      name,
      logo: logoUrl,
      public_key,
      api_password,
      environment: environment || "egypt",
      status: status !== undefined ? Boolean(status) : true,
      callback_url: callbackUrl,
    });

    const created = await db.select().from(gedia).limit(1);

    return SuccessResponse(
      res,
      {
        message: "Gedia settings created successfully",
        gedia: {
          ...created[0],
          callback_url: callbackUrl,
        },
      },
      201
    );
  }
}

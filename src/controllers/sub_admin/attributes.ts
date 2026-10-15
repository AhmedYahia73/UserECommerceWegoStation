import { Request, Response } from "express";
import { attributes, values } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getLocalizedText } from "../../utils/localization";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

// 1. Get All Attributes with their Values (Paginated)
export async function getAllAttributes(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(attributes);
  const total = Number(countResult?.total || 0);

  const pagedAttributes = await db.select().from(attributes).limit(limit).offset(offset);

  const attrIds = pagedAttributes.map((a) => a.id);
  const allValues =
    attrIds.length > 0
      ? await db.select().from(values).where(inArray(values.attribute_id, attrIds))
      : [];

  // Group values by attribute_id
  const valuesByAttr = new Map<string, typeof allValues>();
  for (const val of allValues) {
    if (!valuesByAttr.has(val.attribute_id)) {
      valuesByAttr.set(val.attribute_id, []);
    }
    valuesByAttr.get(val.attribute_id)!.push(val);
  }

  const formatted = pagedAttributes.map((attr) => {
    const attrValues = valuesByAttr.get(attr.id) || [];
    return {
      id: attr.id,
      name: getLocalizedText(attr.name, lang),
      names: attr.name,
      createdAt: attr.createdAt,
      updatedAt: attr.updatedAt,
      values: attrValues.map((v) => ({
        id: v.id,
        name: getLocalizedText(v.name, lang),
        names: v.name,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    };
  });

  return SuccessResponse(
    res,
    {
      attributes: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Get Attributes Selection for Product Dropdowns / Variants
export async function getAttributesSelection(req: Request, res: Response) {
  const db = req.db;
  const lang = req.query.lang as string | undefined;

  const allAttributes = await db
    .select({
      id: attributes.id,
      name: attributes.name,
    })
    .from(attributes);

  const allValues = await db
    .select({
      id: values.id,
      name: values.name,
      attribute_id: values.attribute_id,
    })
    .from(values);

  const valuesByAttr = new Map<string, Array<{ id: string; name: string }>>();
  for (const val of allValues) {
    if (!valuesByAttr.has(val.attribute_id)) {
      valuesByAttr.set(val.attribute_id, []);
    }
    valuesByAttr.get(val.attribute_id)!.push({
      id: val.id,
      name: getLocalizedText(val.name, lang),
    });
  }

  const formatted = allAttributes.map((attr) => ({
    id: attr.id,
    name: getLocalizedText(attr.name, lang),
    values: valuesByAttr.get(attr.id) || [],
  }));

  return SuccessResponse(res, { attributes: formatted }, 200);
}

// 3. Get Attribute By ID with its Values
export async function getAttributeById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const lang = req.query.lang as string | undefined;

  const row = await db.select().from(attributes).where(eq(attributes.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Attribute not found");

  const attrValues = await db.select().from(values).where(eq(values.attribute_id, id));

  const formatted = {
    id: row[0].id,
    name: getLocalizedText(row[0].name, lang),
    names: row[0].name,
    createdAt: row[0].createdAt,
    updatedAt: row[0].updatedAt,
    values: attrValues.map((v) => ({
      id: v.id,
      name: getLocalizedText(v.name, lang),
      names: v.name,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    })),
  };

  return SuccessResponse(res, { attribute: formatted }, 200);
}

// 4. Create Attribute with optional Values
export async function createAttribute(req: Request, res: Response) {
  const db = req.db;
  const { name, values: valuesList } = req.body;

  // Insert Attribute
  const [insertResult] = (await db.insert(attributes).values({ name })) as any[];
  
  // Fetch newly created attribute
  const createdAttr = await db
    .select()
    .from(attributes)
    .where(eq(attributes.name, name))
    .orderBy(attributes.createdAt)
    .limit(1);

  const attributeId = createdAttr[0]?.id;

  // Insert Values if provided
  if (attributeId && Array.isArray(valuesList) && valuesList.length > 0) {
    for (const valItem of valuesList) {
      if (valItem.name) {
        await db.insert(values).values({
          attribute_id: attributeId,
          name: valItem.name,
        });
      }
    }
  }

  return SuccessResponse(
    res,
    { message: "Attribute and its values created successfully", id: attributeId },
    201
  );
}

// 5. Update Attribute and Sync its Values
export async function updateAttribute(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, values: valuesList } = req.body;

  const existing = await db.select().from(attributes).where(eq(attributes.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Attribute not found");

  // Update attribute name if provided
  if (name !== undefined) {
    await db.update(attributes).set({ name }).where(eq(attributes.id, id));
  }

  // Sync values if provided
  if (Array.isArray(valuesList)) {
    const existingValues = await db.select().from(values).where(eq(values.attribute_id, id));
    const existingValIds = new Set(existingValues.map((v) => v.id));
    const keepValIds = new Set<string>();

    for (const valItem of valuesList) {
      if (valItem.id && existingValIds.has(valItem.id)) {
        // Update existing value
        await db
          .update(values)
          .set({ name: valItem.name })
          .where(eq(values.id, valItem.id));
        keepValIds.add(valItem.id);
      } else if (valItem.name) {
        // Insert new value
        await db.insert(values).values({
          attribute_id: id,
          name: valItem.name,
        });
      }
    }

    // Delete values that were omitted from valuesList
    const toDeleteIds = existingValues
      .filter((v) => !keepValIds.has(v.id))
      .map((v) => v.id);

    if (toDeleteIds.length > 0) {
      await db.delete(values).where(inArray(values.id, toDeleteIds));
    }
  }

  return SuccessResponse(res, { message: "Attribute updated successfully" }, 200);
}

// 6. Delete Single Attribute
export async function deleteAttribute(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(attributes).where(eq(attributes.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Attribute not found");

  // Values are deleted via ON DELETE CASCADE in database
  await db.delete(attributes).where(eq(attributes.id, id));

  return SuccessResponse(res, { message: "Attribute deleted successfully" }, 200);
}

// 7. Bulk Delete Attributes
export async function bulkDeleteAttributes(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(attributes).where(inArray(attributes.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching attributes found", deletedCount: 0 }, 200);
  }

  await db.delete(attributes).where(inArray(attributes.id, ids));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} attribute(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

// 8. Add Single Value to Attribute
export async function addValueToAttribute(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name } = req.body;

  const existingAttr = await db.select().from(attributes).where(eq(attributes.id, id)).limit(1);
  if (!existingAttr[0]) throw new NotFound("Attribute not found");

  await db.insert(values).values({
    attribute_id: id,
    name,
  });

  return SuccessResponse(res, { message: "Value added to attribute successfully" }, 201);
}

// 9. Update Single Value
export async function updateValue(req: Request, res: Response) {
  const db = req.db;
  const { valueId } = req.params;
  const { name } = req.body;

  const existingVal = await db.select().from(values).where(eq(values.id, valueId)).limit(1);
  if (!existingVal[0]) throw new NotFound("Value not found");

  await db.update(values).set({ name }).where(eq(values.id, valueId));

  return SuccessResponse(res, { message: "Value updated successfully" }, 200);
}

// 10. Delete Single Value
export async function deleteValue(req: Request, res: Response) {
  const db = req.db;
  const { valueId } = req.params;

  const existingVal = await db.select().from(values).where(eq(values.id, valueId)).limit(1);
  if (!existingVal[0]) throw new NotFound("Value not found");

  await db.delete(values).where(eq(values.id, valueId));

  return SuccessResponse(res, { message: "Value deleted successfully" }, 200);
}

// 11. Bulk Delete Values
export async function bulkDeleteValues(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(values).where(inArray(values.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching values found", deletedCount: 0 }, 200);
  }

  await db.delete(values).where(inArray(values.id, ids));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} value(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

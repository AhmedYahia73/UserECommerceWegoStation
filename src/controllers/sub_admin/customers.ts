import { Request, Response } from "express";
import { customers } from "../../models/schema";
import { eq, and, ne, inArray, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { ConflictError, NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { uploadImage, updateImage, deleteImage } from "../../services/imageService";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllCustomers(req: Request, res: Response) {
  const db = req.db;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(customers);
  const total = Number(countResult?.total || 0);

  const list = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      order_num: customers.order_num,
      order_sum: customers.order_sum,
      image: customers.image,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .limit(limit)
    .offset(offset);

  return SuccessResponse(
    res,
    {
      customers: list,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getCustomersSelection(req: Request, res: Response) {
  const db = req.db;
  const list = await db
    .select({
      id: customers.id,
      name: customers.name,
    })
    .from(customers);

  return SuccessResponse(res, { customers: list }, 200);
}

export async function getCustomerById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const row = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      order_num: customers.order_num,
      order_sum: customers.order_sum,
      image: customers.image,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!row[0]) throw new NotFound("Customer not found");

  return SuccessResponse(res, { customer: row[0] }, 200);
}

export async function createCustomer(req: Request, res: Response) {
  const db = req.db;
  const { name, phone, email, order_num, order_sum, image, password } = req.body;

  const existingEmail = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email)).limit(1);
  if (existingEmail[0]) throw new ConflictError("Email already exists");

  const existingPhone = await db.select({ id: customers.id }).from(customers).where(eq(customers.phone, phone)).limit(1);
  if (existingPhone[0]) throw new ConflictError("Phone already exists");

  let imageUrl: string | null = null;
  if (image) {
    imageUrl = await uploadImage(req, image, "uploads");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(customers).values({
    name,
    phone,
    email,
    order_num: order_num ?? 0,
    order_sum: order_sum ?? 0,
    image: imageUrl,
    password: hashedPassword,
  });

  return SuccessResponse(res, { message: "Customer created successfully" }, 201);
}

export async function updateCustomer(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, phone, email, order_num, order_sum, image, password } = req.body;

  const existing = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Customer not found");

  if (email && email !== existing[0].email) {
    const emailTaken = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.email, email), ne(customers.id, id))).limit(1);
    if (emailTaken[0]) throw new ConflictError("Email already exists");
  }

  if (phone && phone !== existing[0].phone) {
    const phoneTaken = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.phone, phone), ne(customers.id, id))).limit(1);
    if (phoneTaken[0]) throw new ConflictError("Phone already exists");
  }

  const updateData: Partial<typeof customers.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (order_num !== undefined) updateData.order_num = order_num;
  if (order_sum !== undefined) updateData.order_sum = order_sum;
  if (password !== undefined) updateData.password = await bcrypt.hash(password, 10);

  if (image !== undefined && image !== existing[0].image) {
    if (image) {
      updateData.image = await updateImage(req, image, "uploads", existing[0].image);
    } else {
      await deleteImage(existing[0].image);
      updateData.image = null;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(customers).set(updateData).where(eq(customers.id, id));
  }

  return SuccessResponse(res, { message: "Customer updated successfully" }, 200);
}

export async function deleteCustomer(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Customer not found");

  if (existing[0].image) {
    await deleteImage(existing[0].image);
  }

  await db.delete(customers).where(eq(customers.id, id));
  return SuccessResponse(res, { message: "Customer deleted successfully" }, 200);
}

export async function bulkDeleteCustomers(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(customers).where(inArray(customers.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching customers found", deletedCount: 0 }, 200);
  }

  for (const item of existing) {
    if (item.image) {
      await deleteImage(item.image);
    }
  }

  await db.delete(customers).where(inArray(customers.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} customer(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

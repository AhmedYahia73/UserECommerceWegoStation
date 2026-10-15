import { Request, Response } from "express";
import { staff, roles } from "../../models/schema";
import { eq, and, ne, inArray, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { ConflictError, NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

export async function getAllStaff(req: Request, res: Response) {
  const db = req.db;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(staff);
  const total = Number(countResult?.total || 0);

  const list = await db
    .select({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role_id: staff.role_id,
      role_name: roles.name,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    })
    .from(staff)
    .leftJoin(roles, eq(staff.role_id, roles.id))
    .limit(limit)
    .offset(offset);

  return SuccessResponse(
    res,
    {
      staff: list,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

export async function getStaffLists(req: Request, res: Response) {
  const db = req.db;
  const rolesList = await db
    .select({
      id: roles.id,
      name: roles.name,
    })
    .from(roles);

  return SuccessResponse(res, { roles: rolesList }, 200);
}

export async function getStaffSelection(req: Request, res: Response) {
  const db = req.db;
  const list = await db
    .select({
      id: staff.id,
      name: staff.name,
    })
    .from(staff);

  return SuccessResponse(res, { staff: list }, 200);
}

export async function getStaffById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const row = await db
    .select({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role_id: staff.role_id,
      role_name: roles.name,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    })
    .from(staff)
    .leftJoin(roles, eq(staff.role_id, roles.id))
    .where(eq(staff.id, id))
    .limit(1);

  if (!row[0]) throw new NotFound("Staff member not found");

  return SuccessResponse(res, { staff: row[0] }, 200);
}

export async function createStaff(req: Request, res: Response) {
  const db = req.db;
  const { name, email, phone, password, role_id } = req.body;

  const roleExists = await db.select({ id: roles.id }).from(roles).where(eq(roles.id, role_id)).limit(1);
  if (!roleExists[0]) throw new NotFound("Role not found");

  const existingEmail = await db.select({ id: staff.id }).from(staff).where(eq(staff.email, email)).limit(1);
  if (existingEmail[0]) throw new ConflictError("Email already exists");

  const existingPhone = await db.select({ id: staff.id }).from(staff).where(eq(staff.phone, phone)).limit(1);
  if (existingPhone[0]) throw new ConflictError("Phone already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(staff).values({
    name,
    email,
    phone,
    password: hashedPassword,
    role_id,
  });

  return SuccessResponse(res, { message: "Staff member created successfully" }, 201);
}

export async function updateStaff(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, email, phone, password, role_id } = req.body;

  const existing = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Staff member not found");

  if (role_id) {
    const roleExists = await db.select({ id: roles.id }).from(roles).where(eq(roles.id, role_id)).limit(1);
    if (!roleExists[0]) throw new NotFound("Role not found");
  }

  if (email && email !== existing[0].email) {
    const emailTaken = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.email, email), ne(staff.id, id))).limit(1);
    if (emailTaken[0]) throw new ConflictError("Email already exists");
  }

  if (phone && phone !== existing[0].phone) {
    const phoneTaken = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.phone, phone), ne(staff.id, id))).limit(1);
    if (phoneTaken[0]) throw new ConflictError("Phone already exists");
  }

  const updateData: Partial<typeof staff.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (role_id !== undefined) updateData.role_id = role_id;
  if (password !== undefined) updateData.password = await bcrypt.hash(password, 10);

  if (Object.keys(updateData).length > 0) {
    await db.update(staff).set(updateData).where(eq(staff.id, id));
  }

  return SuccessResponse(res, { message: "Staff member updated successfully" }, 200);
}

export async function deleteStaff(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Staff member not found");

  await db.delete(staff).where(eq(staff.id, id));
  return SuccessResponse(res, { message: "Staff member deleted successfully" }, 200);
}

export async function bulkDeleteStaff(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(staff).where(inArray(staff.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching staff members found", deletedCount: 0 }, 200);
  }

  await db.delete(staff).where(inArray(staff.id, ids));
  return SuccessResponse(
    res,
    {
      message: `${existing.length} staff member(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

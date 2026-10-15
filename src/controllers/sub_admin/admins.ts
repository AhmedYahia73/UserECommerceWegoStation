import { Request, Response } from "express";
import { admins, roles } from "../../models/schema";
import { eq, and, ne, inArray, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { ConflictError, NotFound, UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { generateAdminToken } from "../../utils/auth";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

// 1. Get All Admins (Paginated, includes role_name, excludes password)
export async function getAllAdmins(req: Request, res: Response) {
  const db = req.db;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(admins);
  const total = Number(countResult?.total || 0);

  const list = await db
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      phone: admins.phone,
      role_id: admins.role_id,
      role_name: roles.name,
      status: admins.status,
      createdAt: admins.createdAt,
      updatedAt: admins.updatedAt,
    })
    .from(admins)
    .leftJoin(roles, eq(admins.role_id, roles.id))
    .limit(limit)
    .offset(offset);

  return SuccessResponse(
    res,
    {
      admins: list,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Get Admins Relational Lists (all related tables needed for creation/edit form)
export async function getAdminsLists(req: Request, res: Response) {
  const db = req.db;
  const rolesList = await db
    .select({
      id: roles.id,
      name: roles.name,
    })
    .from(roles);

  return SuccessResponse(res, { roles: rolesList }, 200);
}

// 3. Get Admins Selection for Dropdowns (id, name)
export async function getAdminsSelection(req: Request, res: Response) {
  const db = req.db;
  const list = await db
    .select({
      id: admins.id,
      name: admins.name,
    })
    .from(admins)
    .where(eq(admins.status, true));

  return SuccessResponse(res, { admins: list }, 200);
}

// 4. Get Admin By ID
export async function getAdminById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const row = await db
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      phone: admins.phone,
      role_id: admins.role_id,
      role_name: roles.name,
      status: admins.status,
      createdAt: admins.createdAt,
      updatedAt: admins.updatedAt,
    })
    .from(admins)
    .leftJoin(roles, eq(admins.role_id, roles.id))
    .where(eq(admins.id, id))
    .limit(1);

  if (!row[0]) throw new NotFound("Admin not found");

  return SuccessResponse(res, { admin: row[0] }, 200);
}

// 5. Create Admin
export async function createAdmin(req: Request, res: Response) {
  const db = req.db;
  const { name, email, phone, password, role_id, status } = req.body;

  // Check email uniqueness
  const existingEmail = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (existingEmail[0]) {
    throw new ConflictError("Admin with this email already exists");
  }

  // Check phone uniqueness
  const existingPhone = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.phone, phone))
    .limit(1);

  if (existingPhone[0]) {
    throw new ConflictError("Admin with this phone number already exists");
  }

  // Verify role existence
  const existingRole = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.id, role_id))
    .limit(1);

  if (!existingRole[0]) {
    throw new NotFound("Assigned role not found");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(admins).values({
    name,
    email,
    phone,
    password: hashedPassword,
    role_id,
    status: status ?? true,
  });

  return SuccessResponse(res, { message: "Admin created successfully" }, 201);
}

// 6. Update Admin
export async function updateAdmin(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, email, phone, password, role_id, status } = req.body;

  const existing = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Admin not found");

  if (email && email !== existing[0].email) {
    const emailTaken = await db
      .select({ id: admins.id })
      .from(admins)
      .where(and(eq(admins.email, email), ne(admins.id, id)))
      .limit(1);

    if (emailTaken[0]) {
      throw new ConflictError("Email already in use by another admin");
    }
  }

  if (phone && phone !== existing[0].phone) {
    const phoneTaken = await db
      .select({ id: admins.id })
      .from(admins)
      .where(and(eq(admins.phone, phone), ne(admins.id, id)))
      .limit(1);

    if (phoneTaken[0]) {
      throw new ConflictError("Phone number already in use by another admin");
    }
  }

  if (role_id && role_id !== existing[0].role_id) {
    const roleExists = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.id, role_id))
      .limit(1);

    if (!roleExists[0]) {
      throw new NotFound("Assigned role not found");
    }
  }

  const updateData: Partial<typeof admins.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (role_id !== undefined) updateData.role_id = role_id;
  if (status !== undefined) updateData.status = status;
  if (password !== undefined) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(admins).set(updateData).where(eq(admins.id, id));
  }

  return SuccessResponse(res, { message: "Admin updated successfully" }, 200);
}

// 7. Delete Admin
export async function deleteAdmin(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Admin not found");

  await db.delete(admins).where(eq(admins.id, id));

  return SuccessResponse(res, { message: "Admin deleted successfully" }, 200);
}

// 8. Bulk Delete Admins
export async function bulkDeleteAdmins(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(admins).where(inArray(admins.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching admins found", deletedCount: 0 }, 200);
  }

  await db.delete(admins).where(inArray(admins.id, ids));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} admin(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

// 9. Admin Login (verifies email, password, and status = true strictly against admin table)
export async function loginTenantAdmin(req: Request, res: Response) {
  const db = req.db;
  const { email, password } = req.body;

  const adminRows = await db
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      phone: admins.phone,
      password: admins.password,
      role_id: admins.role_id,
      role_name: roles.name,
      status: admins.status,
    })
    .from(admins)
    .leftJoin(roles, eq(admins.role_id, roles.id))
    .where(eq(admins.email, email))
    .limit(1);

  if (!adminRows[0]) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!adminRows[0].status) {
    throw new UnauthorizedError("Your admin account is inactive. Please contact the administrator.");
  }

  const match = await bcrypt.compare(password, adminRows[0].password);
  if (!match) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateAdminToken({
    id: adminRows[0].id,
    name: adminRows[0].name,
    email: adminRows[0].email,
    phone: adminRows[0].phone,
  });

  return SuccessResponse(
    res,
    {
      message: "Admin login successful",
      token,
      admin: {
        id: adminRows[0].id,
        name: adminRows[0].name,
        email: adminRows[0].email,
        phone: adminRows[0].phone,
        role_id: adminRows[0].role_id,
        role_name: adminRows[0].role_name,
      },
    },
    200
  );
}

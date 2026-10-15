import { Request, Response } from "express";
import { roles, permissions } from "../../models/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { NotFound } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

function parseActions(actions: any): string[] {
  if (Array.isArray(actions)) return actions;
  if (typeof actions === "string") {
    try {
      const parsed = JSON.parse(actions);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [actions];
    }
  }
  return [];
}

// 1. Get All Roles with their Permissions (Paginated)
export async function getAllRoles(req: Request, res: Response) {
  const db = req.db;
  const { page, limit, offset } = getPaginationParams(req);

  const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(roles);
  const total = Number(countResult?.total || 0);

  const list = await db.select().from(roles).limit(limit).offset(offset);

  const roleIds = list.map((r) => r.id);
  const allPerms =
    roleIds.length > 0
      ? await db.select().from(permissions).where(inArray(permissions.role_id, roleIds))
      : [];

  const permsByRole = new Map<string, typeof allPerms>();
  for (const perm of allPerms) {
    if (!permsByRole.has(perm.role_id)) {
      permsByRole.set(perm.role_id, []);
    }
    permsByRole.get(perm.role_id)!.push(perm);
  }

  const formatted = list.map((role) => {
    const rolePerms = permsByRole.get(role.id) || [];
    return {
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: rolePerms.map((p) => ({
        id: p.id,
        permission: p.permission,
        actions: parseActions(p.actions),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };
  });

  return SuccessResponse(
    res,
    {
      roles: formatted,
      pagination: buildPaginationMeta(total, page, limit),
    },
    200
  );
}

// 2. Get Roles Selection for Dropdowns (id, name)
export async function getRolesSelection(req: Request, res: Response) {
  const db = req.db;
  const list = await db
    .select({
      id: roles.id,
      name: roles.name,
    })
    .from(roles);

  return SuccessResponse(res, { roles: list }, 200);
}

// 3. Get Role By ID with its Permissions
export async function getRoleById(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const row = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!row[0]) throw new NotFound("Role not found");

  const rolePerms = await db.select().from(permissions).where(eq(permissions.role_id, id));

  const formatted = {
    id: row[0].id,
    name: row[0].name,
    createdAt: row[0].createdAt,
    updatedAt: row[0].updatedAt,
    permissions: rolePerms.map((p) => ({
      id: p.id,
      permission: p.permission,
      actions: parseActions(p.actions),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  };

  return SuccessResponse(res, { role: formatted }, 200);
}

// 4. Create Role with Multi Permissions & Actions Array
export async function createRole(req: Request, res: Response) {
  const db = req.db;
  const { name, permissions: permissionsList } = req.body;

  const roleId = randomUUID();

  // Insert Role
  await db.insert(roles).values({
    id: roleId,
    name,
  });

  // Insert Permissions if provided
  if (Array.isArray(permissionsList) && permissionsList.length > 0) {
    for (const item of permissionsList) {
      if (item.permission && Array.isArray(item.actions)) {
        await db.insert(permissions).values({
          id: item.id || randomUUID(),
          role_id: roleId,
          permission: item.permission,
          actions: item.actions,
        });
      }
    }
  }

  // Fetch created role with its permissions
  const createdRole = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  const createdPerms = await db.select().from(permissions).where(eq(permissions.role_id, roleId));

  return SuccessResponse(
    res,
    {
      message: "Role and permissions created successfully",
      role: {
        id: createdRole[0].id,
        name: createdRole[0].name,
        createdAt: createdRole[0].createdAt,
        updatedAt: createdRole[0].updatedAt,
        permissions: createdPerms.map((p) => ({
          id: p.id,
          permission: p.permission,
          actions: parseActions(p.actions),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      },
    },
    201
  );
}

// 5. Update Role and Sync its Permissions
export async function updateRole(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;
  const { name, permissions: permissionsList } = req.body;

  const existing = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Role not found");

  if (name !== undefined) {
    await db.update(roles).set({ name }).where(eq(roles.id, id));
  }

  // Sync permissions if provided
  if (Array.isArray(permissionsList)) {
    const existingPerms = await db.select().from(permissions).where(eq(permissions.role_id, id));
    const existingById = new Map(existingPerms.map((p) => [p.id, p]));
    const existingByName = new Map(existingPerms.map((p) => [p.permission, p]));
    const keepIds = new Set<string>();

    for (const item of permissionsList) {
      if (!item.permission) continue;

      if (item.id && existingById.has(item.id)) {
        // Update existing permission by ID
        await db
          .update(permissions)
          .set({
            permission: item.permission,
            actions: item.actions,
          })
          .where(eq(permissions.id, item.id));
        keepIds.add(item.id);
      } else if (!item.id && existingByName.has(item.permission)) {
        // Update existing permission matched by name
        const match = existingByName.get(item.permission)!;
        await db
          .update(permissions)
          .set({
            actions: item.actions,
          })
          .where(eq(permissions.id, match.id));
        keepIds.add(match.id);
      } else {
        // Insert new permission
        const newPermId = item.id || randomUUID();
        await db.insert(permissions).values({
          id: newPermId,
          role_id: id,
          permission: item.permission,
          actions: item.actions,
        });
        keepIds.add(newPermId);
      }
    }

    // Delete permissions that are no longer in the list
    const toDeleteIds = existingPerms.filter((p) => !keepIds.has(p.id)).map((p) => p.id);
    if (toDeleteIds.length > 0) {
      await db.delete(permissions).where(inArray(permissions.id, toDeleteIds));
    }
  }

  // Fetch updated role with permissions
  const updatedRole = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  const updatedPerms = await db.select().from(permissions).where(eq(permissions.role_id, id));

  return SuccessResponse(
    res,
    {
      message: "Role updated successfully",
      role: {
        id: updatedRole[0].id,
        name: updatedRole[0].name,
        createdAt: updatedRole[0].createdAt,
        updatedAt: updatedRole[0].updatedAt,
        permissions: updatedPerms.map((p) => ({
          id: p.id,
          permission: p.permission,
          actions: parseActions(p.actions),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      },
    },
    200
  );
}

// 6. Delete Role (and cascade delete its permissions)
export async function deleteRole(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params;

  const existing = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!existing[0]) throw new NotFound("Role not found");

  // Explicitly delete permissions first to ensure clean removal
  await db.delete(permissions).where(eq(permissions.role_id, id));
  await db.delete(roles).where(eq(roles.id, id));

  return SuccessResponse(res, { message: "Role deleted successfully" }, 200);
}

// 7. Bulk Delete Roles (and cascade delete their permissions)
export async function bulkDeleteRoles(req: Request, res: Response) {
  const db = req.db;
  const { ids } = req.body as { ids: string[] };

  const existing = await db.select().from(roles).where(inArray(roles.id, ids));
  if (existing.length === 0) {
    return SuccessResponse(res, { message: "No matching roles found", deletedCount: 0 }, 200);
  }

  const roleIds = existing.map((r) => r.id);
  await db.delete(permissions).where(inArray(permissions.role_id, roleIds));
  await db.delete(roles).where(inArray(roles.id, roleIds));

  return SuccessResponse(
    res,
    {
      message: `${existing.length} role(s) deleted successfully`,
      deletedCount: existing.length,
    },
    200
  );
}

// 8. Individual Permission Endpoints
export async function createPermission(req: Request, res: Response) {
  const db = req.db;
  const { id } = req.params; // role_id
  const { permission, actions } = req.body;

  const existingRole = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!existingRole[0]) throw new NotFound("Role not found");

  const permId = randomUUID();
  await db.insert(permissions).values({
    id: permId,
    role_id: id,
    permission,
    actions,
  });

  return SuccessResponse(
    res,
    {
      message: "Permission added to role successfully",
      permission: {
        id: permId,
        role_id: id,
        permission,
        actions,
      },
    },
    201
  );
}

export async function updatePermission(req: Request, res: Response) {
  const db = req.db;
  const { permissionId } = req.params;
  const { permission, actions } = req.body;

  const existing = await db.select().from(permissions).where(eq(permissions.id, permissionId)).limit(1);
  if (!existing[0]) throw new NotFound("Permission not found");

  const updateData: Partial<typeof permissions.$inferInsert> = {};
  if (permission !== undefined) updateData.permission = permission;
  if (actions !== undefined) updateData.actions = actions;

  if (Object.keys(updateData).length > 0) {
    await db.update(permissions).set(updateData).where(eq(permissions.id, permissionId));
  }

  return SuccessResponse(res, { message: "Permission updated successfully" }, 200);
}

export async function deletePermission(req: Request, res: Response) {
  const db = req.db;
  const { permissionId } = req.params;

  const existing = await db.select().from(permissions).where(eq(permissions.id, permissionId)).limit(1);
  if (!existing[0]) throw new NotFound("Permission not found");

  await db.delete(permissions).where(eq(permissions.id, permissionId));

  return SuccessResponse(res, { message: "Permission deleted successfully" }, 200);
}

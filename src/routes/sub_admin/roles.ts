import { Router } from "express";
import {
  getAllRoles,
  getRolesSelection,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  bulkDeleteRoles,
  createPermission,
  updatePermission,
  deletePermission,
} from "../../controllers/sub_admin/roles";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdParamSchema,
  createPermissionSchema,
  updatePermissionSchema,
  permissionIdParamSchema,
} from "../../validators/sub_admin/roles";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";

const router = Router();

// Bulk delete operations (MUST precede /:id)
router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteRoles));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteRoles));

// Individual Permission operations (MUST precede /:id)
router.put("/permissions/:permissionId", checkOnlyAdmin(), validate(updatePermissionSchema), catchAsync(updatePermission));
router.delete("/permissions/:permissionId", checkOnlyAdmin(), validate(permissionIdParamSchema), catchAsync(deletePermission));

// Role queries & selection
router.get("/", checkOnlyAdmin(), catchAsync(getAllRoles));
router.get("/select", checkOnlyAdmin(), catchAsync(getRolesSelection));

// Role CRUD
router.get("/:id", checkOnlyAdmin(), validate(roleIdParamSchema), catchAsync(getRoleById));
router.post("/", checkOnlyAdmin(), validate(createRoleSchema), catchAsync(createRole));
router.put("/:id", checkOnlyAdmin(), validate(updateRoleSchema), catchAsync(updateRole));
router.delete("/:id", checkOnlyAdmin(), validate(roleIdParamSchema), catchAsync(deleteRole));

// Add permission to specific role
router.post("/:id/permissions", checkOnlyAdmin(), validate(createPermissionSchema), catchAsync(createPermission));

export default router;

import { Router } from "express";
import {
  getAllAdmins,
  getAdminsLists,
  getAdminsSelection,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  bulkDeleteAdmins,
  loginTenantAdmin,
} from "../../controllers/sub_admin/admins";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createAdminSchema,
  updateAdminSchema,
  adminIdParamSchema,
  adminLoginSchema,
} from "../../validators/sub_admin/admins";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";

const router = Router();

// Public: Admin Login on tenant subdomain
router.post("/login", validate(adminLoginSchema), catchAsync(loginTenantAdmin));

// Bulk delete operations (MUST precede /:id)
router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteAdmins));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteAdmins));

// Query operations
router.get("/", checkOnlyAdmin(), catchAsync(getAllAdmins));
router.get("/lists", checkOnlyAdmin(), catchAsync(getAdminsLists));
router.get("/select", checkOnlyAdmin(), catchAsync(getAdminsSelection));

// CRUD operations
router.get("/:id", checkOnlyAdmin(), validate(adminIdParamSchema), catchAsync(getAdminById));
router.post("/", checkOnlyAdmin(), validate(createAdminSchema), catchAsync(createAdmin));
router.put("/:id", checkOnlyAdmin(), validate(updateAdminSchema), catchAsync(updateAdmin));
router.delete("/:id", checkOnlyAdmin(), validate(adminIdParamSchema), catchAsync(deleteAdmin));

export default router;

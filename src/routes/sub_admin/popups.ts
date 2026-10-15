import { Router } from "express";
import {
  getAllPopups,
  getPopupsSelection,
  getPopupById,
  createPopup,
  updatePopup,
  deletePopup,
  bulkDeletePopups,
} from "../../controllers/sub_admin/popups";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createPopupSchema,
  updatePopupSchema,
  popupIdParamSchema,
} from "../../validators/sub_admin/popups";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";
import { uploadMultipleImages } from "../../middlewares/upload";

const router = Router();

// Bulk delete operations (MUST precede /:id)
router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeletePopups));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeletePopups));

// Query operations
router.get("/", checkOnlyAdmin(), catchAsync(getAllPopups));
router.get("/select", checkOnlyAdmin(), catchAsync(getPopupsSelection));

// CRUD operations
router.get("/:id", checkOnlyAdmin(), validate(popupIdParamSchema), catchAsync(getPopupById));
router.post("/", checkOnlyAdmin(), uploadMultipleImages("image", 10), validate(createPopupSchema), catchAsync(createPopup));
router.put("/:id", checkOnlyAdmin(), uploadMultipleImages("image", 10), validate(updatePopupSchema), catchAsync(updatePopup));
router.delete("/:id", checkOnlyAdmin(), validate(popupIdParamSchema), catchAsync(deletePopup));

export default router;

import { Router } from "express";
import {
  getAllWarranties,
  getWarrantiesSelection,
  getWarrantyById,
  createWarranty,
  updateWarranty,
  deleteWarranty,
  bulkDeleteWarranties,
} from "../../controllers/sub_admin/warranties";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createWarrantySchema,
  updateWarrantySchema,
  warrantyIdParamSchema,
} from "../../validators/sub_admin/warranties";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";
import { uploadSingleImage } from "../../middlewares/upload";

const router = Router();

router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteWarranties));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteWarranties));

router.get("/", checkOnlyAdmin(), catchAsync(getAllWarranties));
router.get("/select", checkOnlyAdmin(), catchAsync(getWarrantiesSelection));
router.get("/:id", checkOnlyAdmin(), validate(warrantyIdParamSchema), catchAsync(getWarrantyById));
router.post("/", checkOnlyAdmin(), uploadSingleImage("logo"), validate(createWarrantySchema), catchAsync(createWarranty));
router.put("/:id", checkOnlyAdmin(), uploadSingleImage("logo"), validate(updateWarrantySchema), catchAsync(updateWarranty));
router.delete("/:id", checkOnlyAdmin(), validate(warrantyIdParamSchema), catchAsync(deleteWarranty));

export default router;

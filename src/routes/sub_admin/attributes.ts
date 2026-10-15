import { Router } from "express";
import {
  getAllAttributes,
  getAttributesSelection,
  getAttributeById,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  bulkDeleteAttributes,
  addValueToAttribute,
  updateValue,
  deleteValue,
  bulkDeleteValues,
} from "../../controllers/sub_admin/attributes";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createAttributeSchema,
  updateAttributeSchema,
  attributeIdParamSchema,
  createValueSchema,
  updateValueSchema,
  valueIdParamSchema,
} from "../../validators/sub_admin/attributes";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";

const router = Router();

// Bulk operations (MUST precede /:id)
router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteAttributes));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteAttributes));

// Value Bulk operations
router.post("/values/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteValues));
router.delete("/values/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteValues));

// Individual Value operations
router.put("/values/:valueId", checkOnlyAdmin(), validate(updateValueSchema), catchAsync(updateValue));
router.delete("/values/:valueId", checkOnlyAdmin(), validate(valueIdParamSchema), catchAsync(deleteValue));

// Attribute list & selection
router.get("/", checkOnlyAdmin(), catchAsync(getAllAttributes));
router.get("/select", checkOnlyAdmin(), catchAsync(getAttributesSelection));
router.get("/lists", checkOnlyAdmin(), catchAsync(getAttributesSelection));

// Attribute CRUD
router.get("/:id", checkOnlyAdmin(), validate(attributeIdParamSchema), catchAsync(getAttributeById));
router.post("/", checkOnlyAdmin(), validate(createAttributeSchema), catchAsync(createAttribute));
router.put("/:id", checkOnlyAdmin(), validate(updateAttributeSchema), catchAsync(updateAttribute));
router.delete("/:id", checkOnlyAdmin(), validate(attributeIdParamSchema), catchAsync(deleteAttribute));

// Add value to specific attribute
router.post("/:id/values", checkOnlyAdmin(), validate(createValueSchema), catchAsync(addValueToAttribute));

export default router;

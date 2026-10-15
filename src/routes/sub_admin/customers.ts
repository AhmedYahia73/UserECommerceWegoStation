import { Router } from "express";
import {
  getAllCustomers,
  getCustomersSelection,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
} from "../../controllers/sub_admin/customers";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
} from "../../validators/sub_admin/customers";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";
import { uploadSingleImage } from "../../middlewares/upload";

const router = Router();

router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteCustomers));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteCustomers));

router.get("/", checkOnlyAdmin(), catchAsync(getAllCustomers));
router.get("/select", checkOnlyAdmin(), catchAsync(getCustomersSelection));
router.get("/:id", checkOnlyAdmin(), validate(customerIdParamSchema), catchAsync(getCustomerById));
router.post("/", checkOnlyAdmin(), uploadSingleImage("image"), validate(createCustomerSchema), catchAsync(createCustomer));
router.put("/:id", checkOnlyAdmin(), uploadSingleImage("image"), validate(updateCustomerSchema), catchAsync(updateCustomer));
router.delete("/:id", checkOnlyAdmin(), validate(customerIdParamSchema), catchAsync(deleteCustomer));

export default router;

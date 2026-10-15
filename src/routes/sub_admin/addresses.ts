import { Router } from "express";
import {
  getAllAddresses,
  getAddressLists,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  bulkDeleteAddresses,
} from "../../controllers/sub_admin/addresses";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from "../../validators/sub_admin/addresses";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";

const router = Router();

router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteAddresses));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteAddresses));

router.get("/", checkOnlyAdmin(), catchAsync(getAllAddresses));
router.get("/lists", checkOnlyAdmin(), catchAsync(getAddressLists));
router.get("/:id", checkOnlyAdmin(), validate(addressIdParamSchema), catchAsync(getAddressById));
router.post("/", checkOnlyAdmin(), validate(createAddressSchema), catchAsync(createAddress));
router.put("/:id", checkOnlyAdmin(), validate(updateAddressSchema), catchAsync(updateAddress));
router.delete("/:id", checkOnlyAdmin(), validate(addressIdParamSchema), catchAsync(deleteAddress));

export default router;

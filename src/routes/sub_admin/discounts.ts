import { Router } from "express";
import {
  getAllDiscounts,
  getDiscountsSelection,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  bulkDeleteDiscounts,
} from "../../controllers/sub_admin/discounts";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createDiscountSchema,
  updateDiscountSchema,
  discountIdParamSchema,
} from "../../validators/sub_admin/discounts";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";

const router = Router();

router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteDiscounts));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteDiscounts));

router.get("/", checkOnlyAdmin(), catchAsync(getAllDiscounts));
router.get("/select", checkOnlyAdmin(), catchAsync(getDiscountsSelection));
router.get("/:id", checkOnlyAdmin(), validate(discountIdParamSchema), catchAsync(getDiscountById));
router.post("/", checkOnlyAdmin(), validate(createDiscountSchema), catchAsync(createDiscount));
router.put("/:id", checkOnlyAdmin(), validate(updateDiscountSchema), catchAsync(updateDiscount));
router.delete("/:id", checkOnlyAdmin(), validate(discountIdParamSchema), catchAsync(deleteDiscount));

export default router;

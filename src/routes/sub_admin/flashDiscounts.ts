import { Router } from "express";
import {
  getAllFlashDiscounts,
  getFlashDiscountsSelection,
  getFlashDiscountById,
  createFlashDiscount,
  updateFlashDiscount,
  deleteFlashDiscount,
  bulkDeleteFlashDiscounts,
} from "../../controllers/sub_admin/flashDiscounts";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createFlashDiscountSchema,
  updateFlashDiscountSchema,
  flashDiscountIdParamSchema,
} from "../../validators/sub_admin/flashDiscounts";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";

const router = Router();

router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteFlashDiscounts));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteFlashDiscounts));

router.get("/", checkOnlyAdmin(), catchAsync(getAllFlashDiscounts));
router.get("/select", checkOnlyAdmin(), catchAsync(getFlashDiscountsSelection));
router.get("/:id", checkOnlyAdmin(), validate(flashDiscountIdParamSchema), catchAsync(getFlashDiscountById));
router.post("/", checkOnlyAdmin(), validate(createFlashDiscountSchema), catchAsync(createFlashDiscount));
router.put("/:id", checkOnlyAdmin(), validate(updateFlashDiscountSchema), catchAsync(updateFlashDiscount));
router.delete("/:id", checkOnlyAdmin(), validate(flashDiscountIdParamSchema), catchAsync(deleteFlashDiscount));

export default router;

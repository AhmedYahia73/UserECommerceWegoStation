import { Router } from "express";
import { getPaymob, createOrUpdatePaymob } from "../../controllers/sub_admin/paymob";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import { createUpdatePaymobSchema } from "../../validators/sub_admin/paymob";
import { uploadSingleImage } from "../../middlewares/upload";

const router = Router();

// 1. View Paymob Configuration
router.get("/", checkOnlyAdmin(), catchAsync(getPaymob));

// 2. Create or Update Paymob Configuration (Supports POST and PUT)
router.post(
  "/",
  checkOnlyAdmin(),
  uploadSingleImage("logo"),
  validate(createUpdatePaymobSchema),
  catchAsync(createOrUpdatePaymob)
);

router.put(
  "/",
  checkOnlyAdmin(),
  uploadSingleImage("logo"),
  validate(createUpdatePaymobSchema),
  catchAsync(createOrUpdatePaymob)
);

export default router;

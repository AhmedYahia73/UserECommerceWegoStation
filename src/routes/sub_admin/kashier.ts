import { Router } from "express";
import { getKashier, createOrUpdateKashier } from "../../controllers/sub_admin/kashier";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import { createUpdateKashierSchema } from "../../validators/sub_admin/kashier";
import { uploadSingleImage } from "../../middlewares/upload";

const router = Router();

// 1. View Kashier Configuration
router.get("/", checkOnlyAdmin(), catchAsync(getKashier));

// 2. Create or Update Kashier Configuration (Supports POST and PUT)
router.post(
  "/",
  checkOnlyAdmin(),
  uploadSingleImage("logo"),
  validate(createUpdateKashierSchema),
  catchAsync(createOrUpdateKashier)
);

router.put(
  "/",
  checkOnlyAdmin(),
  uploadSingleImage("logo"),
  validate(createUpdateKashierSchema),
  catchAsync(createOrUpdateKashier)
);

export default router;

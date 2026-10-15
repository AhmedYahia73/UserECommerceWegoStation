import { Router } from "express";
import { getGedia, createOrUpdateGedia } from "../../controllers/sub_admin/gedia";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import { createUpdateGediaSchema } from "../../validators/sub_admin/gedia";
import { uploadSingleImage } from "../../middlewares/upload";

const router = Router();

// 1. View Gedia Configuration
router.get("/", checkOnlyAdmin(), catchAsync(getGedia));

// 2. Create or Update Gedia Configuration (Supports POST and PUT)
router.post(
  "/",
  checkOnlyAdmin(),
  uploadSingleImage("logo"),
  validate(createUpdateGediaSchema),
  catchAsync(createOrUpdateGedia)
);

router.put(
  "/",
  checkOnlyAdmin(),
  uploadSingleImage("logo"),
  validate(createUpdateGediaSchema),
  catchAsync(createOrUpdateGedia)
);

export default router;

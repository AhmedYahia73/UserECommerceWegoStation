import { Router } from "express";
import { getFawry, createOrUpdateFawry } from "../../controllers/sub_admin/fawry";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import { createUpdateFawrySchema } from "../../validators/sub_admin/fawry";
import { uploadSingleImage } from "../../middlewares/upload";

const router = Router();

// 1. View Fawry Configuration
router.get("/", checkOnlyAdmin(), catchAsync(getFawry));

// 2. Create or Update Fawry Configuration (Supports POST and PUT)
router.post(
  "/",
  checkOnlyAdmin(),
  uploadSingleImage("logo"),
  validate(createUpdateFawrySchema),
  catchAsync(createOrUpdateFawry)
);

router.put(
  "/",
  checkOnlyAdmin(),
  uploadSingleImage("logo"),
  validate(createUpdateFawrySchema),
  catchAsync(createOrUpdateFawry)
);

export default router;

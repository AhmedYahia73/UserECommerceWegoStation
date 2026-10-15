import { Router } from "express";
import {
  getAllLanguages,
  getLanguagesSelection,
  getLanguageById,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  bulkDeleteLanguages,
} from "../../controllers/sub_admin/languages";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createLanguageSchema,
  updateLanguageSchema,
  languageIdParamSchema,
} from "../../validators/sub_admin/languages";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";

const router = Router();

router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteLanguages));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteLanguages));

router.get("/", checkOnlyAdmin(), catchAsync(getAllLanguages));
router.get("/select", checkOnlyAdmin(), catchAsync(getLanguagesSelection));
router.get("/:id", checkOnlyAdmin(), validate(languageIdParamSchema), catchAsync(getLanguageById));
router.post("/", checkOnlyAdmin(), validate(createLanguageSchema), catchAsync(createLanguage));
router.put("/:id", checkOnlyAdmin(), validate(updateLanguageSchema), catchAsync(updateLanguage));
router.delete("/:id", checkOnlyAdmin(), validate(languageIdParamSchema), catchAsync(deleteLanguage));

export default router;

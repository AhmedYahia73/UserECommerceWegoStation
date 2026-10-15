import { Router } from "express";
import {
  getAllCities,
  getCitiesSelection,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  bulkDeleteCities,
} from "../../controllers/sub_admin/cities";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";
import {
  createCitySchema,
  updateCitySchema,
  cityIdParamSchema,
} from "../../validators/sub_admin/cities";
import { bulkDeleteSchema } from "../../validators/sub_admin/common";

const router = Router();

router.post("/bulk-delete", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteCities));
router.delete("/bulk", checkOnlyAdmin(), validate(bulkDeleteSchema), catchAsync(bulkDeleteCities));

router.get("/", checkOnlyAdmin(), catchAsync(getAllCities));
router.get("/select", checkOnlyAdmin(), catchAsync(getCitiesSelection));
router.get("/:id", checkOnlyAdmin(), validate(cityIdParamSchema), catchAsync(getCityById));
router.post("/", checkOnlyAdmin(), validate(createCitySchema), catchAsync(createCity));
router.put("/:id", checkOnlyAdmin(), validate(updateCitySchema), catchAsync(updateCity));
router.delete("/:id", checkOnlyAdmin(), validate(cityIdParamSchema), catchAsync(deleteCity));

export default router;

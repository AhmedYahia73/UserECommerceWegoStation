import { Router } from "express";
import { tenantMiddleware } from "../models/tenantDb";
import {
  gediaCallback,
  paymobCallback,
  kashierCallback,
  fawryCallback,
} from "../controllers/callbacks/paymentCallbacks";
import { catchAsync } from "../utils/catchAsync";

const router = Router();

// Resolve tenant wildcard schema based on subdomain
router.use(tenantMiddleware);

// 1. Geidea Callback
router.post("/gedia_callback", catchAsync(gediaCallback));
router.get("/gedia_callback", catchAsync(gediaCallback));

// 2. Paymob Callback
router.post("/paymob_callback", catchAsync(paymobCallback));
router.get("/paymob_callback", catchAsync(paymobCallback));

// 3. Kashier Callback
router.post("/kashier_callback", catchAsync(kashierCallback));
router.get("/kashier_callback", catchAsync(kashierCallback));

// 4. Fawry Callback
router.post("/fawry_callback", catchAsync(fawryCallback));
router.get("/fawry_callback", catchAsync(fawryCallback));

export default router;

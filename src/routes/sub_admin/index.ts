import { Router } from "express";
import { tenantMiddleware } from "../../models/tenantDb";

import languagesRouter from "./languages";
import rolesRouter from "./roles";
import taxesRouter from "./taxes";
import warrantiesRouter from "./warranties";
import discountsRouter from "./discounts";
import flashDiscountsRouter from "./flashDiscounts";
import brandsRouter from "./brands";
import categoriesRouter from "./categories";
import citiesRouter from "./cities";
import zonesRouter from "./zones";
import customersRouter from "./customers";
import staffRouter from "./staff";
import paymentMethodsRouter from "./paymentMethods";
import addressesRouter from "./addresses";
import productsRouter from "./products";
import attributesRouter from "./attributes";
import popupsRouter from "./popups";
import adminsRouter from "./admins";
import gediaRouter from "./gedia";
import paymobRouter from "./paymob";
import kashierRouter from "./kashier";
import fawryRouter from "./fawry";
import uploadRouter from "../upload";

const router = Router();

// 1. Resolve tenant wildcard schema based on subdomain for all sub_admin endpoints
router.use(tenantMiddleware);

// 2. Mount CRUD routers
router.use("/languages", languagesRouter);
router.use("/roles", rolesRouter);
router.use("/taxes", taxesRouter);
router.use("/warranties", warrantiesRouter);
router.use("/discounts", discountsRouter);
router.use("/flash_discounts", flashDiscountsRouter);
router.use("/brands", brandsRouter);
router.use("/categories", categoriesRouter);
router.use("/cities", citiesRouter);
router.use("/zones", zonesRouter);
router.use("/customers", customersRouter);
router.use("/staff", staffRouter);
router.use("/payment_methods", paymentMethodsRouter);
router.use("/addresses", addressesRouter);
router.use("/products", productsRouter);
router.use("/attributes", attributesRouter);
router.use("/popups", popupsRouter);
router.use("/admins", adminsRouter);
router.use("/gedia", gediaRouter);
router.use("/paymob", paymobRouter);
router.use("/kashier", kashierRouter);
router.use("/fawry", fawryRouter);
router.use("/upload", uploadRouter);

export default router;

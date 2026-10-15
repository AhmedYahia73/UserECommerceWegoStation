import { Router } from "express";
import subAdminRoute from "./sub_admin";
import uploadRoute from "./upload";
import callbacksRoute from "./callbacks";

const route = Router();

// Payment gateway callbacks (e.g. /api/gedia_callback, /api/paymob_callback, etc.)
route.use("/", callbacksRoute);

// Dedicated form-data upload routes
route.use("/upload", uploadRoute);

// Mount SubAdmin multi-tenancy routes
route.use("/sub_admin", subAdminRoute);

export default route;
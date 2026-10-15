import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as tenantSchema from "./schema";
import { users } from "./central/users";
import { packages } from "./central/packages";
import { eq } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";
import { NotFound } from "../Errors";
import { StatusCodes } from "http-status-codes";
import { getLocalizedText } from "../utils/localization";
import "dotenv/config";

// 1. Central Database Pool & Instance
const centralPool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_CENTRAL_NAME || process.env.DB_NAME || "systigo",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const centralDb = drizzle(centralPool);

// 2. Cache of Tenant Database Pools
const tenantPools = new Map<string, MySql2Database<typeof tenantSchema>>();

export function getTenantDb(subdomain: string): MySql2Database<typeof tenantSchema> {
  const cached = tenantPools.get(subdomain);
  if (cached) return cached;

  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: subdomain, // In MySQL wildcard multi-tenancy, each tenant schema is its subdomain database
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const tenantDb = drizzle(pool, { schema: tenantSchema, mode: "default" });
  tenantPools.set(subdomain, tenantDb);
  return tenantDb;
}

/**
 * Extracts subdomain from request:
 * 1. Header 'x-subdomain'
 * 2. Query param 'subdomain'
 * 3. Host / Hostname: part before the first dot '.' (e.g. ahmed.wego.com -> ahmed)
 */
export function extractSubdomain(req: Request): string {
  let subdomain = (req.headers["x-subdomain"] as string) || "";
  if (subdomain) {
    return subdomain.trim().toLowerCase();
  }

  if (req.query?.subdomain && typeof req.query.subdomain === "string") {
    return req.query.subdomain.trim().toLowerCase();
  }

  const rawHost = req.headers.host || req.hostname || "";
  const cleanHost = rawHost.split(":")[0].trim().toLowerCase();

  if (cleanHost) {
    const parts = cleanHost.split(".");
    // Example: ahmed.wego.com -> parts = ["ahmed", "wego", "com"]
    // Subdomain is the segment before the first "." (المقطع اللى قبل .)
    if (parts.length > 1) {
      if (parts[0] === "www" && parts.length > 2) {
        subdomain = parts[1];
      } else if (parts[0] !== "localhost" && parts[0] !== "127") {
        subdomain = parts[0];
      }
    }
  }

  return subdomain;
}

/**
 * Checks whether the tenant's central subscription is currently active:
 * users.start_date <= now() AND users.end_date >= now()
 */
export function isSubscriptionActive(
  startDateVal: string | Date | null | undefined,
  endDateVal: string | Date | null | undefined
): boolean {
  if (!startDateVal || !endDateVal) {
    return false;
  }

  const now = new Date();

  const toDateString = (val: string | Date): string => {
    if (typeof val === "string") {
      return val.slice(0, 10);
    }
    return val.toISOString().slice(0, 10);
  };

  const startStr = toDateString(startDateVal);
  const endStr = toDateString(endDateVal);

  const todayUtcStr = now.toISOString().slice(0, 10);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayLocalStr = `${year}-${month}-${day}`;

  const isStartValid = startStr <= todayUtcStr || startStr <= todayLocalStr;
  const isEndValid = endStr >= todayUtcStr || endStr >= todayLocalStr;

  return isStartValid && isEndValid;
}

// 3. Subdomain Multi-Tenancy Middleware
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    const subdomain = extractSubdomain(req);

    if (!subdomain) {
      throw new NotFound("Subdomain not found");
    }

    // Verify subdomain exists in central database users table
    const tenantUser = await centralDb
      .select()
      .from(users)
      .where(eq(users.subdomain, subdomain))
      .limit(1);

    if (!tenantUser[0]) {
      throw new NotFound("Subdomain not found");
    }

    const currentTenant = tenantUser[0];

    // Check subscription active: start_date <= now() AND end_date >= now()
    const isCallbackEndpoint =
      req.path.includes("_callback") || req.originalUrl.includes("_callback");
    const active = isSubscriptionActive(currentTenant.start_date, currentTenant.end_date);

    if (!active && !isCallbackEndpoint) {
      const lang = (req.query.lang as string) || (req.headers["lang"] as string) || "en";

      // Fetch all packages from central database
      const centralPackages = await centralDb
        .select({
          id: packages.id,
          name: packages.name,
          type: packages.type,
          price: packages.price,
          status: packages.status,
        })
        .from(packages);

      const formattedPackages = centralPackages.map((pkg) => ({
        id: pkg.id,
        name: getLocalizedText(pkg.name, lang, "en"),
        type: pkg.type,
        price: pkg.price,
        status: pkg.status,
      }));

      return res.status(StatusCodes.FORBIDDEN).json({
        status: false,
        success: false,
        message: "Tenant subscription has expired or is inactive",
        packages: formattedPackages,
      });
    }

    // Attach tenant db instance and info to request
    req.subdomain = subdomain;
    req.tenant = currentTenant;
    req.db = getTenantDb(subdomain);

    next();
  } catch (error) {
    next(error);
  }
}


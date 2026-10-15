import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../Errors";
import { verifyToken } from "../utils/auth";
import { admins } from "../models/schema";
import { eq } from "drizzle-orm";

export const checkOnlyAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let userId = req.user?.id;

      // إذا لم يكن req.user مضبوطاً مسبقاً، نستخرج الـ Token ونفك تشفيره
      if (!userId) {
        const authHeader = req.headers.authorization;
        let token: string | undefined;

        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.split(" ")[1];
        } else if ((req as any).cookies?.token) {
          token = (req as any).cookies.token;
        }

        if (!token) {
          throw new UnauthorizedError("Authentication token is required");
        }

        const decoded = verifyToken(token);
        userId = decoded.id;
      }

      if (!req.db) {
        throw new UnauthorizedError("Tenant database connection not initialized");
      }

      // التحقق الصارم من وجود المستخدم في جدول admin فقط وأن حالته status = true
      const adminRows = await req.db
        .select({
          id: admins.id,
          name: admins.name,
          email: admins.email,
          phone: admins.phone,
          role_id: admins.role_id,
          status: admins.status,
        })
        .from(admins)
        .where(eq(admins.id, userId))
        .limit(1);

      if (!adminRows[0]) {
        throw new UnauthorizedError("Access denied: User does not exist in admin table");
      }

      if (!adminRows[0].status) {
        throw new UnauthorizedError("Access denied: Admin account is inactive (status = false)");
      }

      // تثبيت بيانات الـ Admin في req.user
      req.user = {
        id: adminRows[0].id,
        name: adminRows[0].name,
        email: adminRows[0].email,
        phone: adminRows[0].phone,
        role: "admin",
      };

      return next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkPermission = checkOnlyAdmin;
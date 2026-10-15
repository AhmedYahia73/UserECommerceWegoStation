// src/types/custom.d.ts

import { MySql2Database } from "drizzle-orm/mysql2";
import * as tenantSchema from "../models/schema";
import { users } from "../models/central/users";

export type AdminType = "admin";
export type StaffType = "staff";
export type Role = AdminType | StaffType | string;

export interface TokenPayload {
  id: string;
  name: string;
  role: Role;
  email?: string;
  phone?: string;
}

export type AppUser = TokenPayload;

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
      db: MySql2Database<typeof tenantSchema>;
      subdomain: string;
      tenant: typeof users.$inferSelect;
    }
  }
}
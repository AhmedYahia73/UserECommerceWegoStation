import { mysqlTable, char, varchar, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { permissions } from "./permissions";
import { staff } from "./staff";

export const roles = mysqlTable("role", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(permissions),
  staff: many(staff),
}));

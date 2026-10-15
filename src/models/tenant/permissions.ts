import { mysqlTable, char, varchar, json, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { roles } from "./roles";

export const permissions = mysqlTable("perimission", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  role_id: char("role_id", { length: 36 })
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permission: varchar("permission", { length: 255 }).notNull(),
  actions: json("actions").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const permissionsRelations = relations(permissions, ({ one }) => ({
  role: one(roles, {
    fields: [permissions.role_id],
    references: [roles.id],
  }),
}));

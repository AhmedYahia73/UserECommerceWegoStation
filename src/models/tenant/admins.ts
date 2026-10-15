import { mysqlTable, char, varchar, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { roles } from "./roles";

export const admins = mysqlTable("admin", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role_id: char("role_id", { length: 36 })
    .notNull()
    .references(() => roles.id, { onDelete: "restrict" }),
  status: boolean("status").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const adminsRelations = relations(admins, ({ one }) => ({
  role: one(roles, {
    fields: [admins.role_id],
    references: [roles.id],
  }),
}));

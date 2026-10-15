import { mysqlTable, char, varchar, int, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { addresses } from "./addresses";

export const customers = mysqlTable("customer", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  order_num: int("order_num").default(0).notNull(),
  order_sum: int("order_sum").default(0).notNull(),
  image: varchar("image", { length: 500 }),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(addresses),
}));

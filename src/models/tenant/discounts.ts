import { mysqlTable, char, json, mysqlEnum, decimal, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const discounts = mysqlTable("discount", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  type: mysqlEnum("type", ["percentage", "value"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: boolean("status").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

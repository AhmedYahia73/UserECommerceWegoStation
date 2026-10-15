import { mysqlTable, char, json, varchar, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const warranties = mysqlTable("warranty", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  text: json("text").$type<{ [key: string]: string }>().notNull(),
  logo: varchar("logo", { length: 500 }),
  period: varchar("period", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

import { mysqlTable, char, json, varchar, text, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const kashier = mysqlTable("kashier", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  logo: varchar("logo", { length: 500 }).notNull(),
  api_key: text("api_key").notNull(),
  secret_key: text("secret_key").notNull(),
  merchant_id: text("merchant_id").notNull(),
  status: boolean("status").notNull().default(true),
  callback_url: varchar("callback_url", { length: 500 }).default("{subdomain}/api/kashier_callback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

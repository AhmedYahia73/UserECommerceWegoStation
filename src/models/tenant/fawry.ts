import { mysqlTable, char, json, varchar, text, mysqlEnum, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const fawryBaseUrlEnum = mysqlEnum("fawry_base_url", ["Staging", "Live"]);

export const fawry = mysqlTable("fawry", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  logo: varchar("logo", { length: 500 }).notNull(),
  merchant_code: text("merchant_code"),
  merchant_secret_key: text("merchant_secret_key").notNull(),
  fawry_base_url: mysqlEnum("fawry_base_url", ["Staging", "Live"])
    .notNull()
    .default("Staging"),
  status: boolean("status").notNull().default(true),
  callback_url: varchar("callback_url", { length: 500 }).default("{subdomain}/api/fawry_callback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

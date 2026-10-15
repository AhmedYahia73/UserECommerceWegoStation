import { mysqlTable, char, json, varchar, text, mysqlEnum, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const gediaEnvironmentEnum = mysqlEnum("environment", [
  "egypt",
  "saudi_arabia",
  "uae",
]);

export const gedia = mysqlTable("gedia", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  logo: varchar("logo", { length: 500 }).notNull(),
  public_key: text("public_key").notNull(),
  api_password: text("api_password").notNull(),
  environment: mysqlEnum("environment", [
    "egypt",
    "saudi_arabia",
    "uae",
  ]).notNull().default("egypt"),
  status: boolean("status").notNull().default(true),
  callback_url: varchar("callback_url", { length: 500 }).default("{subdomain}/api/gedia_callback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

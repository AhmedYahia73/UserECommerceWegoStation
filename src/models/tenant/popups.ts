import { mysqlTable, char, json, varchar, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const popups = mysqlTable("popup", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  image: json("image").$type<string[]>().notNull(),
  link: varchar("link", { length: 500 }),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  description: json("description").$type<{ [key: string]: string }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

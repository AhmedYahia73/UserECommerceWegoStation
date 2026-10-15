import { mysqlTable, char, json, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { zones } from "./zones";
import { addresses } from "./addresses";

export const cities = mysqlTable("city", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<string[]>().notNull(),
  status: boolean("status").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const citiesRelations = relations(cities, ({ many }) => ({
  zones: many(zones),
  addresses: many(addresses),
}));

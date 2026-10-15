import { mysqlTable, char, json, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { cities } from "./cities";
import { addresses } from "./addresses";

export const zones = mysqlTable("zone", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<string[]>().notNull(),
  city_id: char("city_id", { length: 36 })
    .notNull()
    .references(() => cities.id, { onDelete: "cascade" }),
  status: boolean("status").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const zonesRelations = relations(zones, ({ one, many }) => ({
  city: one(cities, {
    fields: [zones.city_id],
    references: [cities.id],
  }),
  addresses: many(addresses),
}));

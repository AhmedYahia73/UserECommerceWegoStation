import { mysqlTable, char, varchar, text, decimal, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { customers } from "./customers";
import { cities } from "./cities";
import { zones } from "./zones";

export const addresses = mysqlTable("address", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  customer_id: char("customer_id", { length: 36 })
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  city_id: char("city_id", { length: 36 })
    .notNull()
    .references(() => cities.id, { onDelete: "restrict" }),
  zone_id: char("zone_id", { length: 36 })
    .notNull()
    .references(() => zones.id, { onDelete: "restrict" }),
  building_num: varchar("building_num", { length: 50 }),
  floor: varchar("floor", { length: 50 }),
  address: text("address").notNull(),
  street: varchar("street", { length: 255 }),
  additional_data: text("additional_data"),
  lat: decimal("lat", { precision: 10, scale: 8 }),
  lng: decimal("lng", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, {
    fields: [addresses.customer_id],
    references: [customers.id],
  }),
  city: one(cities, {
    fields: [addresses.city_id],
    references: [cities.id],
  }),
  zone: one(zones, {
    fields: [addresses.zone_id],
    references: [zones.id],
  }),
}));

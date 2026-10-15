import { mysqlTable, char, json, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { values } from "./values";
import { productAttributes } from "./productAttributes";

export const attributes = mysqlTable("attribute", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const attributesRelations = relations(attributes, ({ many }) => ({
  values: many(values),
  productAttributes: many(productAttributes),
}));

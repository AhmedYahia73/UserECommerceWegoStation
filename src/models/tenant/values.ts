import { mysqlTable, char, json, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { attributes } from "./attributes";

export const values = mysqlTable("value", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  attribute_id: char("attribute_id", { length: 36 })
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const valuesRelations = relations(values, ({ one }) => ({
  attribute: one(attributes, {
    fields: [values.attribute_id],
    references: [attributes.id],
  }),
}));

import { mysqlTable, char, json, varchar, int, decimal, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { products } from "./products";

export const productValues = mysqlTable("product_values", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  product_id: char("product_id", { length: 36 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  value_ids: json("value_ids").$type<string[]>().notNull(),
  sku: varchar("sku", { length: 100 }),
  quantity: int("quantity").default(1).notNull(),
  image: varchar("image", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const productValuesRelations = relations(productValues, ({ one }) => ({
  product: one(products, {
    fields: [productValues.product_id],
    references: [products.id],
  }),
}));

import { mysqlTable, char, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { products } from "./products";
import { attributes } from "./attributes";

export const productAttributes = mysqlTable("product_attribute", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  product_id: char("product_id", { length: 36 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  attribute_id: char("attribute_id", { length: 36 })
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const productAttributesRelations = relations(
  productAttributes,
  ({ one }) => ({
    product: one(products, {
      fields: [productAttributes.product_id],
      references: [products.id],
    }),
    attribute: one(attributes, {
      fields: [productAttributes.attribute_id],
      references: [attributes.id],
    }),
  })
);

import { mysqlTable, char, json, varchar, text, boolean, int, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";
import { categories } from "./categories";
import { brands } from "./brands";
import { discounts } from "./discounts";
import { flashDiscounts } from "./flashDiscounts";
import { taxes } from "./taxes";
import { warranties } from "./warranties";
import { productAttributes } from "./productAttributes";
import { productValues } from "./productValues";

export const products = mysqlTable("products", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  description: json("description").$type<{ [key: string]: string }>(),
  category_id: char("category_id", { length: 36 })
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  sub_category_id: char("sub_category_id", { length: 36 })
    .references(() => categories.id, { onDelete: "set null" }),
  brand_id: char("brand_id", { length: 36 })
    .references(() => brands.id, { onDelete: "set null" }),
  discount_id: char("discount_id", { length: 36 })
    .references(() => discounts.id, { onDelete: "set null" }),
  flash_discount_id: char("flash_discount_id", { length: 36 })
    .references(() => flashDiscounts.id, { onDelete: "set null" }),
  tax_id: char("tax_id", { length: 36 })
    .references(() => taxes.id, { onDelete: "set null" }),
  image: varchar("image", { length: 500 }).notNull(),
  warrantly_id: char("warrantly_id", { length: 36 })
    .references(() => warranties.id, { onDelete: "set null" }),
  warrantly_note: text("warrantly_note"),
  today_deal: boolean("today_deal").default(false).notNull(),
  free_shipping: boolean("free_shipping").default(false).notNull(),
  shipping_days: int("shipping_days").default(0).notNull(),
  gallery: json("gallery").$type<string[]>(),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.category_id],
    references: [categories.id],
  }),
  subCategory: one(categories, {
    fields: [products.sub_category_id],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brand_id],
    references: [brands.id],
  }),
  discount: one(discounts, {
    fields: [products.discount_id],
    references: [discounts.id],
  }),
  flashDiscount: one(flashDiscounts, {
    fields: [products.flash_discount_id],
    references: [flashDiscounts.id],
  }),
  tax: one(taxes, {
    fields: [products.tax_id],
    references: [taxes.id],
  }),
  warranty: one(warranties, {
    fields: [products.warrantly_id],
    references: [warranties.id],
  }),
  attributes: many(productAttributes),
  variants: many(productValues),
}));

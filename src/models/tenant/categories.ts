import { mysqlTable, char, json, int, varchar, timestamp } from "drizzle-orm/mysql-core";
import { sql, relations } from "drizzle-orm";

export const categories = mysqlTable("category", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: json("name").$type<{ [key: string]: string }>().notNull(),
  category_id: char("category_id", { length: 36 }),
  order_number: int("order_number").default(0).notNull(),
  banner: varchar("banner", { length: 500 }),
  icon: varchar("icon", { length: 500 }),
  cover_image: varchar("cover_image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.category_id],
    references: [categories.id],
    relationName: "sub_categories",
  }),
  subCategories: many(categories, {
    relationName: "sub_categories",
  }),
}));

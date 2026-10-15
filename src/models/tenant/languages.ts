import { mysqlTable, char, varchar, boolean, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const languages = mysqlTable("lang", {
  id: char("id", { length: 36 })
    .primaryKey()
    .default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull(),
  status: boolean("status").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

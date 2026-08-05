import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  plan: text("plan", { enum: ["free", "plus"] }).notNull().default("free"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const pets = sqliteTable("pets", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  breed: text("breed"),
  bornOn: text("born_on"),
  passedOn: text("passed_on"),
  story: text("story"),
  visibility: text("visibility", { enum: ["public", "private"] }).notNull().default("private"),
  searchable: integer("searchable", { mode: "boolean" }).notNull().default(false),
  coverKey: text("cover_key"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  petId: text("pet_id").notNull().references(() => pets.id),
  objectKey: text("object_key").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  status: text("status").notNull(),
  billingCycle: text("billing_cycle", { enum: ["monthly", "annual"] }).notNull(),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
});

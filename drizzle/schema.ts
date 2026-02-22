import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  displayOrder: int("displayOrder").default(0).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  discountPercent: int("discountPercent").default(0),
  categoryLine: varchar("categoryLine", { length: 100 }).notNull(),
  material: varchar("material", { length: 100 }).notNull(),
  accessoryType: varchar("accessoryType", { length: 100 }).notNull(),
  images: json("images").$type<string[]>(),
  featured: int("featured").default(0).notNull(),
  active: int("active").default(1).notNull(),
  stock: int("stock").default(0),
  displayOrder: int("displayOrder").default(0).notNull(),
  weightGrams: int("weightGrams"),
  lengthCm: int("lengthCm"),
  widthCm: int("widthCm"),
  heightCm: int("heightCm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled", "shipped", "delivered"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentId: varchar("paymentId", { length: 255 }),
  mpPaymentId: varchar("mpPaymentId", { length: 255 }),
  shippingMethod: varchar("shippingMethod", { length: 100 }),
  shippingPrice: decimal("shippingPrice", { precision: 10, scale: 2 }).default("0"),
  shippingCep: varchar("shippingCep", { length: 10 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerCpf: varchar("customerCpf", { length: 14 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 500 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

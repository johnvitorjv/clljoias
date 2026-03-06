import { serial, integer, pgEnum, pgTable, text, timestamp, varchar, decimal, jsonb } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "approved", "rejected", "cancelled", "shipped", "delivered"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  displayOrder: integer("displayOrder").default(0).notNull(),
  active: integer("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  discountPercent: integer("discountPercent").default(0),
  categoryLine: varchar("categoryLine", { length: 100 }).notNull(),
  material: varchar("material", { length: 100 }).notNull(),
  accessoryType: varchar("accessoryType", { length: 100 }).notNull(),
  images: jsonb("images").$type<string[]>(),
  featured: integer("featured").default(0).notNull(),
  active: integer("active").default(1).notNull(),
  stock: integer("stock").default(0),
  displayOrder: integer("displayOrder").default(0).notNull(),
  weightGrams: integer("weightGrams"),
  lengthCm: integer("lengthCm"),
  widthCm: integer("widthCm"),
  heightCm: integer("heightCm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  status: orderStatusEnum("status").default("pending").notNull(),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  productName: varchar("productName", { length: 500 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

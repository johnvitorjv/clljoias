CREATE TYPE "public"."order_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'shipped', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"image" text,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "orderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"productId" integer NOT NULL,
	"productName" varchar(500) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"paymentMethod" varchar(50),
	"paymentId" varchar(255),
	"mpPaymentId" varchar(255),
	"shippingMethod" varchar(100),
	"shippingPrice" numeric(10, 2) DEFAULT '0',
	"shippingCep" varchar(10),
	"subtotal" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"customerName" varchar(255) NOT NULL,
	"customerCpf" varchar(14),
	"customerEmail" varchar(320),
	"customerPhone" varchar(20),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"originalPrice" numeric(10, 2),
	"discountPercent" integer DEFAULT 0,
	"categoryLine" varchar(100) NOT NULL,
	"material" varchar(100) NOT NULL,
	"accessoryType" varchar(100) NOT NULL,
	"images" jsonb,
	"featured" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"stock" integer DEFAULT 0,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"weightGrams" integer,
	"lengthCm" integer,
	"widthCm" integer,
	"heightCm" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);

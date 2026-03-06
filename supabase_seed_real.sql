-- 1. ESTRUTURA DAS TABELAS (Mapeadas a partir do Drizzle)
DO $$ BEGIN
    CREATE TYPE "public"."order_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'shipped', 'delivered');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."role" AS ENUM('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "categories" (
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

CREATE TABLE IF NOT EXISTS "products" (
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

CREATE TABLE IF NOT EXISTS "users" (
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

CREATE TABLE IF NOT EXISTS "orders" (
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

CREATE TABLE IF NOT EXISTS "orderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"productId" integer NOT NULL,
	"productName" varchar(500) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"notes" text
);

-- 2. SETUP DE RLS (Row Level Security)
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura_publica_categorias" ON "categories";
CREATE POLICY "Leitura_publica_categorias" ON "categories" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura_publica_produtos" ON "products";
CREATE POLICY "Leitura_publica_produtos" ON "products" FOR SELECT USING (true);

-- 3. SEED DE DADOS REAIS

-- Inserindo Categorias Reais
INSERT INTO "categories" ("id", "name", "slug", "description", "image", "displayOrder", "active") 
VALUES (1, 'Pratas 925', 'pratas-925', 'Joias em prata 925 legítima', NULL, 1, 1)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "description" = EXCLUDED."description", "active" = EXCLUDED."active";

INSERT INTO "categories" ("id", "name", "slug", "description", "image", "displayOrder", "active") 
VALUES (2, 'Relógios', 'relogios', 'Relógios de qualidade', NULL, 2, 1)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "description" = EXCLUDED."description", "active" = EXCLUDED."active";

INSERT INTO "categories" ("id", "name", "slug", "description", "image", "displayOrder", "active") 
VALUES (3, 'Semi-joias', 'semi-joias', 'Semi-joias banhadas com garantia', NULL, 3, 1)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "description" = EXCLUDED."description", "active" = EXCLUDED."active";

INSERT INTO "categories" ("id", "name", "slug", "description", "image", "displayOrder", "active") 
VALUES (4, 'Tornozeleiras', 'tornozeleiras', 'Tornozeleiras delicadas', NULL, 4, 1)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "description" = EXCLUDED."description", "active" = EXCLUDED."active";

INSERT INTO "categories" ("id", "name", "slug", "description", "image", "displayOrder", "active") 
VALUES (5, 'Personalizados', 'personalizados', 'Acessórios personalizados sob encomenda', NULL, 5, 1)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "description" = EXCLUDED."description", "active" = EXCLUDED."active";

INSERT INTO "categories" ("id", "name", "slug", "description", "image", "displayOrder", "active") 
VALUES (6, 'Personalizados Pet', 'personalizados-pet', 'Acessórios personalizados para pets', NULL, 6, 1)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "description" = EXCLUDED."description", "active" = EXCLUDED."active";


-- Inserindo Produtos Reais
INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (1, 'Colar Personalizado Aço Inox  Fotonome', 'colar-personalizado-aco-inox-fotonome-1', 'Colar Personalizado Aço Inox  Fotonome - Personalizados', 99.9, NULL, 'Personalizados', 'Aço Inox', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797969367-4hmxv.jpeg"]'::jsonb, 1, 0, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (2, 'Colar Personalizado Com Frase E Nome (p) Prata', 'colar-personalizado-com-frase-e-nome-p-prata-2', 'Colar Personalizado Com Frase E Nome (p) Prata - Personalizados', 130, NULL, 'Personalizados', 'Aço Inox', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797969634-w1ogvn.jpeg"]'::jsonb, 1, 0, 10, 1)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (3, 'Colar Personalizado Aço Inox', 'colar-personalizado-aco-inox-3', 'Colar Personalizado Aço Inox - Personalizados', 119.9, NULL, 'Personalizados', 'Aço Inox', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797969840-00dog.jpeg"]'::jsonb, 1, 0, 10, 2)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (4, 'Colar Personalizado Aço Inox', 'colar-personalizado-aco-inox-4', 'Colar Personalizado Aço Inox - Personalizados', 119.9, NULL, 'Personalizados', 'Aço Inox', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797970058-nm6xeo.jpeg"]'::jsonb, 1, 0, 10, 3)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (5, 'Colar Personalizado Aço Inox', 'colar-personalizado-aco-inox-5', 'Colar Personalizado Aço Inox - Personalizados', 99.9, NULL, 'Personalizados', 'Aço Inox', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797970272-u1y0m.jpeg"]'::jsonb, 1, 0, 10, 4)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (6, 'Escapulário Em Aço Inoxfrasenome', 'escapulario-em-aco-inoxfrasenome-6', 'Escapulário Em Aço Inoxfrasenome - Personalizados', 119.9, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797970506-w0qa2.jpeg"]'::jsonb, 1, 0, 10, 5)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (7, 'Escapulário Personalizado Prata', 'escapulario-personalizado-prata-7', 'Escapulário Personalizado Prata - Personalizados', 199.9, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797970728-nvgexd.jpeg"]'::jsonb, 1, 0, 10, 6)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (8, 'Imã Personalizado', 'ima-personalizado-8', 'Imã Personalizado - Personalizados', 65, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797970933-a4sck.jpeg"]'::jsonb, 1, 0, 10, 7)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (9, 'Personalizado Foto+frase', 'personalizado-foto-frase-9', 'Personalizado Foto+frase - Personalizados', 75, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797971142-8crh3s.jpeg"]'::jsonb, 1, 0, 10, 8)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (10, 'Personalizado Foto+frase', 'personalizado-foto-frase-10', 'Personalizado Foto+frase - Personalizados', 75, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797971362-sq41k.jpeg"]'::jsonb, 1, 0, 10, 9)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (11, 'Personalizado Banho Prata Fotoe Frase', 'personalizado-banho-prata-fotoe-frase-11', 'Personalizado Banho Prata Fotoe Frase - Personalizados', 99.9, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797971578-r1rqrs.jpeg"]'::jsonb, 1, 0, 10, 10)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (12, 'Personalizado Banho Ouro Foto E Frase', 'personalizado-banho-ouro-foto-e-frase-12', 'Personalizado Banho Ouro Foto E Frase - Personalizados', 119.8, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797971794-fovrka.jpeg"]'::jsonb, 1, 0, 10, 11)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (13, 'Personalizado Banho Ouro Foto+frase', 'personalizado-banho-ouro-foto-frase-13', 'Personalizado Banho Ouro Foto+frase - Personalizados', 119.9, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797972091-43wugr.jpeg"]'::jsonb, 1, 0, 10, 12)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (14, 'Personalizado Banho Ouro Nomefrase', 'personalizado-banho-ouro-nomefrase-14', 'Personalizado Banho Ouro Nomefrase - Personalizados', 89.9, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797972325-ysotb5.jpeg"]'::jsonb, 1, 0, 10, 13)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (15, 'Personalizado Banho Prata Foto+frase', 'personalizado-banho-prata-foto-frase-15', 'Personalizado Banho Prata Foto+frase - Personalizados', 99.9, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797972533-chfzlp.jpeg"]'::jsonb, 1, 0, 10, 14)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (16, 'Personalizado Banho Prata Nomefrase', 'personalizado-banho-prata-nomefrase-16', 'Personalizado Banho Prata Nomefrase - Personalizados', 85.9, NULL, 'Personalizados', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797972775-mk5ek.jpeg"]'::jsonb, 1, 0, 10, 15)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (17, 'Pingente Personalizado Com Fotonome', 'pingente-personalizado-com-fotonome-17', 'Pingente Personalizado Com Fotonome - Personalizados', 60, NULL, 'Personalizados', 'Aço Inox', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797973010-rbsoi.jpeg"]'::jsonb, 1, 0, 10, 16)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (18, 'Pingente Personalizado Com Fotoenome', 'pingente-personalizado-com-fotoenome-18', 'Pingente Personalizado Com Fotoenome - Personalizados', 60, NULL, 'Personalizados', 'Aço Inox', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797973224-g35e6r.jpeg"]'::jsonb, 1, 0, 10, 17)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (19, 'Pingente Personalizado Com Frasenome', 'pingente-personalizado-com-frasenome-19', 'Pingente Personalizado Com Frasenome - Personalizados', 58.9, NULL, 'Personalizados', 'Aço Inox', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797973501-e2m2qb.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797973603-z3pkfo.jpeg"]'::jsonb, 1, 0, 10, 18)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (20, 'Pulseira Olhar Personalizado Aço Inox', 'pulseira-olhar-personalizado-aco-inox-20', 'Pulseira Olhar Personalizado Aço Inox - Personalizados', 95.9, NULL, 'Personalizados', 'Aço Inox', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797973808-khsmc.jpeg"]'::jsonb, 1, 0, 10, 19)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (21, 'Trio De Pulseiras No Banho Prata', 'trio-de-pulseiras-no-banho-prata-21', 'Trio De Pulseiras No Banho Prata - Personalizados', 180, NULL, 'Personalizados', 'Aço Inox', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797974034-bpp1rs.jpeg"]'::jsonb, 1, 0, 10, 20)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (22, 'Coleira Personalizada Para Cães', 'coleira-personalizada-para-caes-22', 'Coleira Personalizada Para Cães - Personalizados Pet', 75, NULL, 'Personalizados Pet', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797974253-ez57o.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797974362-duvpxr.jpeg"]'::jsonb, 1, 0, 10, 21)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (23, 'Coleira Personalizada Para Cães', 'coleira-personalizada-para-caes-23', 'Coleira Personalizada Para Cães - Personalizados Pet', 75, NULL, 'Personalizados Pet', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797974610-2ayprb.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797974704-93uhp.jpeg"]'::jsonb, 1, 0, 10, 22)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (24, 'Coleira Personalizada Para Gatos(a)s', 'coleira-personalizada-para-gatos-a-s-24', 'Coleira Personalizada Para Gatos(a)s - Personalizados Pet', 75, NULL, 'Personalizados Pet', 'Aço Inox', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797974947-ju5cdb.jpeg"]'::jsonb, 1, 0, 10, 23)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (25, 'Anel Love', 'anel-love-25', 'Anel Love - Pratas 925', 80, NULL, 'Pratas 925', 'Prata 925', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797975175-ndwupc.jpeg"]'::jsonb, 1, 0, 10, 24)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (26, 'Anel Coracao', 'anel-coracao-26', 'Anel Coracao - Pratas 925', 80, NULL, 'Pratas 925', 'Prata 925', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797975404-6k9s7.jpeg"]'::jsonb, 1, 0, 10, 25)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (27, 'Anel Estrela Cadente', 'anel-estrela-cadente-27', 'Anel Estrela Cadente - Pratas 925', 80, NULL, 'Pratas 925', 'Prata 925', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797975643-xi7evf.jpeg"]'::jsonb, 1, 0, 10, 26)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (28, 'Argola-estrela', 'argola-estrela-28', 'Argola-estrela - Pratas 925', 60, NULL, 'Pratas 925', 'Prata 925', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797975883-4g3bxf.jpeg"]'::jsonb, 1, 0, 10, 27)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (29, 'Brinco Estrela Cravejada em Prata', 'brinco-estrela-cravejada-em-prata-29', 'Brinco Estrela Cravejada em Prata - Pratas 925', 67.9, NULL, 'Pratas 925', 'Prata 925', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797976130-hqf3q.jpeg"]'::jsonb, 1, 0, 10, 28)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (30, 'Brinco Flor', 'brinco-flor-30', 'Brinco Flor - Pratas 925', 65, NULL, 'Pratas 925', 'Prata 925', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797976386-knmjc.jpeg"]'::jsonb, 1, 0, 10, 29)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (31, 'Brinco Olhar', 'brinco-olhar-31', 'Brinco Olhar - Pratas 925', 65, NULL, 'Pratas 925', 'Prata 925', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797976626-zfc2us.jpeg"]'::jsonb, 1, 0, 10, 30)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (32, 'Brinco S', 'brinco-s-32', 'Brinco S - Pratas 925', 88, NULL, 'Pratas 925', 'Prata 925', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797976867-fhmi5n.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797976980-c12abe.jpeg"]'::jsonb, 1, 0, 10, 31)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (33, 'Brinco Gota Rubi', 'brinco-gota-rubi-33', 'Brinco Gota Rubi - Pratas 925', 68.9, NULL, 'Pratas 925', 'Prata 925', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797977242-oxgf8b.jpeg"]'::jsonb, 1, 0, 10, 32)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (34, 'Choker Bolinhas', 'choker-bolinhas-34', 'Choker Bolinhas - Pratas 925', 85, NULL, 'Pratas 925', 'Prata 925', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797977490-5fr2kt.jpeg"]'::jsonb, 1, 0, 10, 33)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (35, 'Colar Helena', 'colar-helena-35', 'Colar Helena - Pratas 925', 82, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797977704-0tt9sf.jpeg"]'::jsonb, 1, 1, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (36, 'Colar Izabel', 'colar-izabel-36', 'Colar Izabel - Pratas 925', 92.99, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797977976-4ox5zo.jpeg"]'::jsonb, 1, 0, 10, 35)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (37, 'Colar Inicial ', 'colar-letras925-37', 'Colar Letras925( - Pratas 925', 89.9, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797978190-4slq4.jpeg"]'::jsonb, 1, 1, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (38, 'Colar Priss', 'colar-priss-38', 'Colar Priss - Pratas 925', 85, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797978496-ose6zo.jpeg"]'::jsonb, 1, 0, 10, 37)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (39, 'Colar Rubi', 'colar-rubi-39', 'Colar Rubi - Pratas 925', 85, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797978737-3o9in.jpeg"]'::jsonb, 1, 1, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (40, 'Colar Coração Pixel', 'colar-coracao-pixel-40', 'Colar Coração Pixel - Pratas 925', 99.9, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797978971-15ti5l.jpeg"]'::jsonb, 1, 0, 10, 39)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (41, 'Colar Coração Vazado', 'colar-coracao-vazado-41', 'Colar Coração Vazado - Pratas 925', 85, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797979252-r36spg.jpeg"]'::jsonb, 1, 0, 10, 40)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (42, 'Colar Esmeralda', 'colar-esmeralda-42', 'Colar Esmeralda - Pratas 925', 99.99, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797979469-hgypy7.jpeg"]'::jsonb, 1, 0, 10, 41)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (43, 'Colar Estrela Do Mar', 'colar-estrela-do-mar-43', 'Colar Estrela Do Mar - Pratas 925', 70, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797979687-1ir1tn.jpeg"]'::jsonb, 1, 0, 10, 42)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (44, 'Colar Flor', 'colar-flor-44', 'Colar Flor - Pratas 925', 99.9, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797979990-uge97c.jpeg"]'::jsonb, 1, 0, 10, 43)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (45, 'Colar Florzinha', 'colar-florzinha-45', 'Colar Florzinha - Pratas 925', 89.99, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797980211-99hnn.jpeg"]'::jsonb, 1, 0, 10, 44)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (46, 'Colar Gota Cravejada', 'colar-gota-cravejada-46', 'Colar Gota Cravejada - Pratas 925', 92.9, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797980432-twyk8q.jpeg"]'::jsonb, 1, 0, 10, 45)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (47, 'Colar Gota Sol', 'colar-gota-sol-47', 'Colar Gota Sol - Pratas 925', 82, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797980641-s05icm.jpeg"]'::jsonb, 1, 0, 10, 46)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (48, 'Colar Jade Azul', 'colar-jade-azul-48', 'Colar Jade Azul - Pratas 925', 89.9, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797980880-d6zhn.jpeg"]'::jsonb, 1, 0, 10, 47)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (49, 'Colar Love Pink', 'colar-love-pink-49', 'Colar Love Pink - Pratas 925', 85, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797981122-z2e7k.jpeg"]'::jsonb, 1, 0, 10, 48)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (50, 'Colar Mandala', 'colar-mandala-50', 'Colar Mandala - Pratas 925', 85, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797981356-cpzq09.jpeg"]'::jsonb, 1, 0, 10, 49)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (51, 'Colar Moon', 'colar-moon-51', 'Colar Moon - Pratas 925', 79.9, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797981604-rmvg7j.jpeg"]'::jsonb, 1, 0, 10, 50)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (52, 'Colar Olho Cravejado', 'colar-olho-cravejado-52', 'Colar Olho Cravejado - Pratas 925', 88.9, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797981842-b72rvk.jpeg"]'::jsonb, 1, 0, 10, 51)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (53, 'Colar Star', 'colar-star-53', 'Colar Star - Pratas 925', 89.9, NULL, 'Pratas 925', 'Prata 925', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797982064-qa6dtw.jpeg"]'::jsonb, 1, 0, 10, 52)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (54, 'Conjuntos Cristais De Coração', 'conjuntos-cristais-de-coracao-54', 'Conjuntos Cristais De Coração - Pratas 925', 89.9, NULL, 'Pratas 925', 'Prata 925', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797982296-zp2wjs.jpeg"]'::jsonb, 1, 0, 10, 53)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (55, 'Conjuntos Cristais De Coração', 'conjuntos-cristais-de-coracao-55', 'Conjuntos Cristais De Coração - Pratas 925', 89.9, NULL, 'Pratas 925', 'Prata 925', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797982504-hxg65q.jpeg"]'::jsonb, 1, 0, 10, 54)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (56, 'Coração Pink Cravejado', 'coracao-pink-cravejado-56', 'Coração Pink Cravejado - Pratas 925', 99.9, NULL, 'Pratas 925', 'Prata 925', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797982722-oick3t.jpeg"]'::jsonb, 1, 0, 10, 55)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (57, 'Pontos De Luz', 'pontos-de-luz-57', 'Pontos De Luz - Pratas 925', 70, NULL, 'Pratas 925', 'Prata 925', 'Outros', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797982998-724kb.jpeg"]'::jsonb, 1, 0, 10, 56)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (58, 'Pulseira Olho Grego Prata', 'pulseira-olho-grego-prata-58', 'Pulseira Olho Grego Prata - Pratas 925', 68.9, NULL, 'Pratas 925', 'Prata 925', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797983259-hggsu5.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797983412-5d31y.jpeg"]'::jsonb, 1, 0, 10, 57)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (59, 'Trio', 'trio-59', 'Trio - Pratas 925', 82, NULL, 'Pratas 925', 'Prata 925', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797983752-6pdf46.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797983890-jmkfmb.jpeg"]'::jsonb, 1, 0, 10, 58)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (60, 'Trio', 'trio-60', 'Trio - Pratas 925', 82, NULL, 'Pratas 925', 'Prata 925', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797984130-8g9tv4.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797984268-kx52et.jpeg"]'::jsonb, 1, 0, 10, 59)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (61, 'Relogio Casio', 'relogio-casio-61', 'Relogio Casio - Relógios', 80, NULL, 'Relógios', 'Aço Inox', 'Relógios', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797984508-794kyv.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797984630-ua6lvh.jpeg"]'::jsonb, 1, 0, 10, 60)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (62, 'Relogio Casio', 'relogio-casio-62', 'Relogio Casio - Relógios', 125, NULL, 'Relógios', 'Aço Inox', 'Relógios', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797984872-158xc.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797985034-35qr1.jpeg"]'::jsonb, 1, 0, 10, 61)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (63, 'Relogio Casio', 'relogio-casio-63', 'Relogio Casio - Relógios', 125, NULL, 'Relógios', 'Aço Inox', 'Relógios', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797985304-pzumks.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797985441-m01ss.jpeg"]'::jsonb, 1, 0, 10, 62)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (64, 'Relogio Casio', 'relogio-casio-64', 'Relogio Casio - Relógios', 125, NULL, 'Relógios', 'Aço Inox', 'Relógios', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797985691-8ck18.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797985792-vbsjcl.jpeg"]'::jsonb, 1, 0, 10, 63)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (65, 'Relogio Casio', 'relogio-casio-65', 'Relogio Casio - Relógios', 125, NULL, 'Relógios', 'Aço Inox', 'Relógios', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797986033-25o8mf.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797986165-jpjrre.jpeg"]'::jsonb, 1, 0, 10, 64)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (66, 'Relogio Quartz', 'relogio-quartz-66', 'Relogio Quartz - Relógios', 78.9, NULL, 'Relógios', 'Aço Inox', 'Relógios', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797986416-axkx1x.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797986560-szxgh.jpeg"]'::jsonb, 1, 0, 10, 65)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (67, 'Brinco Argola Solitário Prata', 'brinco-argola-solitario-prata-67', 'Brinco Argola Solitário Prata - Semi-joias', 45.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797986772-4z1pum.jpeg"]'::jsonb, 1, 0, 10, 66)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (68, 'Choker Constelação de Estrelas Prata', 'choker-constelacao-de-estrelas-prata-68', 'Choker Constelação de Estrelas Prata - Semi-joias', 55.99, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797987058-cr7lhf.jpeg"]'::jsonb, 1, 0, 10, 67)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (69, 'Choker Trevo da Sorte Prata', 'choker-trevo-da-sorte-prata-69', 'Choker Trevo da Sorte Prata - Semi-joias', 58.9, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797987303-x0221.jpeg"]'::jsonb, 1, 0, 10, 68)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (70, 'Choker Céu Estrelado Dourado', 'choker-ceu-estrelado-dourado-70', 'Choker Céu Estrelado Dourado - Semi-joias', 58.9, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797987526-g1pnu4.jpeg"]'::jsonb, 1, 0, 10, 69)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (71, 'Choker Estrelas e Conchas Prata', 'choker-estrelas-e-conchas-prata-71', 'Choker Estrelas e Conchas Prata - Semi-joias', 52.99, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797987750-nmhp97.jpeg"]'::jsonb, 1, 0, 10, 70)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (72, 'Choker Búzios do Mar Prata', 'choker-buzios-do-mar-prata-72', 'Choker Búzios do Mar Prata - Semi-joias', 55, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797987968-qoq06.jpeg"]'::jsonb, 1, 0, 10, 71)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (73, 'Choker Duplo Pérolas e Esferas Dourado', 'choker-duplo-perolas-e-esferas-dourado-73', 'Choker Duplo Pérolas e Esferas Dourado - Semi-joias', 55.99, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797988196-ra0po.jpeg"]'::jsonb, 1, 0, 10, 72)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (74, 'Choker de Búzios Dourada', 'choker-de-buzios-dourada-74', 'Choker de Búzios Dourada - Semi-joias', 57.9, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797988470-uxc8l.jpeg"]'::jsonb, 1, 0, 10, 73)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (75, 'Choker Medalhinhas Prata', 'choker-medalhinhas-prata-75', 'Choker Medalhinhas Prata - Semi-joias', 58.9, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797988705-qre75l.jpeg"]'::jsonb, 1, 0, 10, 74)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (76, 'Choker Estrelas e Conchas Dourada', 'choker-estrelas-e-conchas-dourada-76', 'Choker Estrelas e Conchas Dourada - Semi-joias', 58.9, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797988941-45acb9.jpeg"]'::jsonb, 1, 0, 10, 75)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (77, 'Choker Plaquinhas de Estrela Dourada', 'choker-plaquinhas-de-estrela-dourada-77', 'Choker Plaquinhas de Estrela Dourada - Semi-joias', 58.99, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797989175-byzcl.jpeg"]'::jsonb, 1, 0, 10, 76)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (78, 'Choker Fita Laminada Prata', 'choker-fita-laminada-prata-78', 'Choker Fita Laminada Prata - Semi-joias', 59.9, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797989426-7tbtyx.jpeg"]'::jsonb, 1, 0, 10, 77)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (79, 'Choker Elo de Corações Prata', 'choker-elo-de-coracoes-prata-79', 'Choker Elo de Corações Prata - Semi-joias', 68.9, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797989694-l7u6qh.jpeg"]'::jsonb, 1, 0, 10, 78)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (80, 'Choker Dupla Esferas e Discos Prata', 'choker-dupla-esferas-e-discos-prata-80', 'Choker Dupla Esferas e Discos Prata - Semi-joias', 52.99, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797989942-t46dn.jpeg"]'::jsonb, 1, 0, 10, 79)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (81, 'Choker de Búzios Prata', 'choker-de-buzios-prata-81', 'Choker de Búzios Prata - Semi-joias', 55, NULL, 'Semi-joias', 'Semijoias', 'Chokers', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797990179-bh1ii.jpeg"]'::jsonb, 1, 0, 10, 80)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (82, 'Colar Concha', 'colar-concha-82', 'Colar Concha - Semi-joias', 57.9, NULL, 'Semi-joias', 'Semijoias', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797990454-u7ha4.jpeg"]'::jsonb, 1, 0, 10, 81)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (83, 'Colar Coração Rubi', 'colar-coracao-rubi-83', 'Colar Coração Rubi - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797990747-mcp65w.jpeg"]'::jsonb, 1, 0, 10, 82)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (84, 'Colar Cruz', 'colar-cruz-84', 'Colar Cruz - Semi-joias', 59.9, NULL, 'Semi-joias', 'Semijoias', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797990972-vlz4jp.jpeg"]'::jsonb, 1, 1, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (85, 'Colar Duplo', 'colar-duplo-85', 'Colar Duplo - Semi-joias', 58.9, NULL, 'Semi-joias', 'Semijoias', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797991177-1wacw.jpeg"]'::jsonb, 1, 0, 10, 84)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (86, 'Colar Pingo Rubi', 'colar-pingo-rubi-86', 'Colar Pingo Rubi - Semi-joias', 53.9, NULL, 'Semi-joias', 'Semijoias', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797991388-ttl9p8.jpeg"]'::jsonb, 1, 0, 10, 85)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (87, 'Colar Trevo', 'colar-trevo-87', 'Colar Trevo - Semi-joias', 48, NULL, 'Semi-joias', 'Semijoias', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797991628-2fh9o4.jpeg"]'::jsonb, 1, 0, 10, 86)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (88, 'Colar Triplo', 'colar-triplo-88', 'Colar Triplo - Semi-joias', 55.9, NULL, 'Semi-joias', 'Semijoias', 'Colares', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797991842-69ceuf.jpeg"]'::jsonb, 1, 0, 10, 87)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (89, 'Conjunto Gota de Luz Prata', 'conjunto-gota-de-luz-prata-89', 'Conjunto Gota de Luz Prata - Semi-joias', 68.9, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797992092-8twhyr.jpeg"]'::jsonb, 1, 0, 10, 88)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (90, 'Conjunto Arco-íris', 'conjunto-arco-iris-90', 'Conjunto Arco-íris - Semi-joias', 65, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797992335-truk8c.jpeg"]'::jsonb, 1, 0, 10, 89)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (91, 'Conjunto Elefante', 'conjunto-elefante-91', 'Conjunto Elefante - Semi-joias', 65, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797992559-u3kqa8.jpeg"]'::jsonb, 1, 0, 10, 90)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (92, 'Conjunto Tartaruga Cravejada', 'conjunto-tartaruga-cravejada-92', 'Conjunto Tartaruga Cravejada - Semi-joias', 60, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797992770-bt8bed.jpeg"]'::jsonb, 1, 0, 10, 91)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (93, 'Dupla Brinco', 'dupla-brinco-93', 'Dupla Brinco - Semi-joias', 64.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797992992-tv7xj.jpeg"]'::jsonb, 1, 0, 10, 92)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (94, 'Pulseira Coração Cravejado', 'pulseira-coracao-cravejado-94', 'Pulseira Coração Cravejado - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797993232-b3fzdf.jpeg"]'::jsonb, 1, 0, 10, 93)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (95, 'Pulseira De Berloques', 'pulseira-de-berloques-95', 'Pulseira De Berloques - Semi-joias', 70, NULL, 'Semi-joias', 'Semijoias', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797993477-atr8cs.jpeg"]'::jsonb, 1, 0, 10, 94)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (96, 'Pulseira De Berloques', 'pulseira-de-berloques-96', 'Pulseira De Berloques - Semi-joias', 75, NULL, 'Semi-joias', 'Semijoias', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797993722-0vz1xo.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797993826-v5piz9.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797993972-0cf5sm.jpeg"]'::jsonb, 1, 1, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (97, 'Pulseira De Berloques', 'pulseira-de-berloques-97', 'Pulseira De Berloques - Semi-joias', 75, NULL, 'Semi-joias', 'Semijoias', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797994229-ts557k.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797994402-wcz8u.jpeg"]'::jsonb, 1, 0, 10, 96)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (98, 'Pulseira Estrela do Mar Dourada', 'pulseira-estrela-do-mar-dourada-98', 'Pulseira Estrela do Mar Dourada - Semi-joias', 52, NULL, 'Semi-joias', 'Semijoias', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797994600-sngwxh.jpeg"]'::jsonb, 1, 0, 10, 97)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (99, 'Pulseira Estrela Do Mar', 'pulseira-estrela-do-mar-99', 'Pulseira Estrela Do Mar - Semi-joias', 48.9, NULL, 'Semi-joias', 'Semijoias', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797994839-b1aqz3.jpeg"]'::jsonb, 1, 0, 10, 98)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (100, 'Pulseira Linhas Cravejadas', 'pulseira-linhas-cravejadas-100', 'Pulseira Linhas Cravejadas - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797995051-jm9z9r.jpeg"]'::jsonb, 1, 0, 10, 99)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (101, 'Anel Cauda de Sereia e Concha Dourado', 'anel-cauda-de-sereia-e-concha-dourado-101', 'Anel Cauda de Sereia e Concha Dourado - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797995280-if15t8.jpeg"]'::jsonb, 1, 0, 10, 100)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (102, 'Anel Rabo de Baleia e Concha Prata', 'anel-rabo-de-baleia-e-concha-prata-102', 'Anel Rabo de Baleia e Concha Prata - Semi-joias', 47.9, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797995571-jsw9ib.jpeg"]'::jsonb, 1, 0, 10, 101)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (103, 'Anel Sol e Lua Dourado', 'anel-sol-e-lua-dourado-103', 'Anel Sol e Lua Dourado - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797995814-oc9eob.jpeg"]'::jsonb, 1, 0, 10, 102)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (104, 'Anel 3 Cores', 'anel-3-cores-104', 'Anel 3 Cores - Semi-joias', 47.9, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797996058-e0986f.jpeg"]'::jsonb, 1, 0, 10, 103)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (105, 'Anel 3 Cores', 'anel-3-cores-105', 'Anel 3 Cores - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797996353-hb3w7t.jpeg"]'::jsonb, 1, 0, 10, 104)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (106, 'Anel Prata Sol e Lua Cravejado', 'anel-prata-sol-e-lua-cravejado-106', 'Anel Prata Sol e Lua Cravejado - Semi-joias', 47.9, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797996582-gev5o7.jpeg"]'::jsonb, 1, 0, 10, 105)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (107, 'Anel de Prata Coração Cravejado', 'anel-de-prata-coracao-cravejado-107', 'Anel de Prata Coração Cravejado - Semi-joias', 48.9, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797996850-q1a44.jpeg"]'::jsonb, 1, 0, 10, 106)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (108, 'Anel Regulável Cravejado Dourado', 'anel-regulavel-cravejado-dourado-108', 'Anel Regulável Cravejado Dourado - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797997107-81oj8.jpeg"]'::jsonb, 1, 0, 10, 107)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (109, 'Anel Coração Cravejado Dourado', 'anel-coracao-cravejado-dourado-109', 'Anel Coração Cravejado Dourado - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797997325-u8ei3q.jpeg"]'::jsonb, 1, 0, 10, 108)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (110, 'Anel Duplo Cravejado', 'anel-duplo-cravejado-110', 'Anel Duplo Cravejado - Semi-joias', 49.99, NULL, 'Semi-joias', 'Semijoias', 'Anéis', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797997565-9gtdcj.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797997705-y37em.jpeg"]'::jsonb, 1, 0, 10, 109)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (111, 'Brinco Coração Raiado Prata', 'brinco-coracao-raiado-prata-111', 'Brinco Coração Raiado Prata - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797997959-rtuv6d.jpeg"]'::jsonb, 1, 0, 10, 110)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (112, 'Brinco Nó Cravejado Prata', 'brinco-no-cravejado-prata-112', 'Brinco Nó Cravejado Prata - Semi-joias', 48.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797998179-gho2yi.jpeg"]'::jsonb, 1, 0, 10, 111)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (113, 'Brinco Coração Cravejado Dourado', 'brinco-coracao-cravejado-dourado-113', 'Brinco Coração Cravejado Dourado - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797998448-lidz7n.jpeg"]'::jsonb, 1, 0, 10, 112)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (114, 'Brinco Coração Raiado Dourado', 'brinco-coracao-raiado-dourado-114', 'Brinco Coração Raiado Dourado - Semi-joias', 52.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797998654-qrk0kjn.jpeg"]'::jsonb, 1, 0, 10, 113)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (115, 'Brinco Coração Vazado Cravejado Prata', 'brinco-coracao-vazado-cravejado-prata-115', 'Brinco Coração Vazado Cravejado Prata - Semi-joias', 52.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797998870-v5s6zg.jpeg"]'::jsonb, 1, 0, 10, 114)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (116, 'Brinco Elo Duplo Cravejado Dourado', 'brinco-elo-duplo-cravejado-dourado-116', 'Brinco Elo Duplo Cravejado Dourado - Semi-joias', 55, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797999148-b0257n.jpeg"]'::jsonb, 1, 0, 10, 115)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (117, 'Brinco Argola Cravejada Baguete', 'brinco-argola-cravejada-baguete-117', 'Brinco Argola Cravejada Baguete - Semi-joias', 42, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797999356-3g0kf4.jpeg"]'::jsonb, 1, 0, 10, 116)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (118, 'Brinco Argola Flores Cravejadas', 'brinco-argola-flores-cravejadas-118', 'Brinco Argola Flores Cravejadas - Semi-joias', 42, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797999554-e1sxzg.jpeg"]'::jsonb, 1, 0, 10, 117)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (119, 'Brinco Sol Radiante', 'brinco-sol-radiante-119', 'Brinco Sol Radiante - Semi-joias', 47.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771797999839-y72wrc.jpeg"]'::jsonb, 1, 0, 10, 118)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (120, 'Brinco Nó Cravejado Prata', 'brinco-no-cravejado-prata-120', 'Brinco Nó Cravejado Prata - Semi-joias', 48.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798000094-dcsxbg.jpeg"]'::jsonb, 1, 0, 10, 119)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (121, 'Brinco Sol e Lua Prata', 'brinco-sol-e-lua-prata-121', 'Brinco Sol e Lua Prata - Semi-joias', 48.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798000315-z28sy.jpeg"]'::jsonb, 1, 0, 10, 120)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (122, 'Brinco Mandala Dourada', 'brinco-mandala-dourada-122', 'Brinco Mandala Dourada - Semi-joias', 48.99, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798000571-i4qbx.jpeg"]'::jsonb, 1, 0, 10, 121)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (123, 'Brinco Argola Retangular Cravejado Dourado', 'brinco-argola-retangular-cravejado-dourado-123', 'Brinco Argola Retangular Cravejado Dourado - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798000787-bihsm.jpeg"]'::jsonb, 1, 0, 10, 122)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (124, 'Brinco Argola Solitário Cristal', 'brinco-argola-solitario-cristal-124', 'Brinco Argola Solitário Cristal - Semi-joias', 49.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798001032-d7x2bw.jpeg"]'::jsonb, 1, 0, 10, 123)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (125, 'Brinco Sol e Lua Dourado', 'brinco-sol-e-lua-dourado-125', 'Brinco Sol e Lua Dourado - Semi-joias', 52.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798001299-336yst.jpeg"]'::jsonb, 1, 0, 10, 124)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (126, 'Brinco Argola Cascata Dourada', 'brinco-argola-cascata-dourada-126', 'Brinco Argola Cascata Dourada - Semi-joias', 55, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798001532-a8064p.jpeg"]'::jsonb, 1, 0, 10, 125)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (127, 'Brinco Argola Dourada Cravejada', 'brinco-argola-dourada-cravejada-127', 'Brinco Argola Dourada Cravejada - Semi-joias', 55, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798001775-aj4glc.jpeg"]'::jsonb, 1, 0, 10, 126)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (128, 'Brinco Gota Lisa Prata', 'brinco-gota-lisa-prata-128', 'Brinco Gota Lisa Prata - Semi-joias', 55, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798002037-xetj8u.jpeg"]'::jsonb, 1, 0, 10, 127)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (129, 'Kit Brincos Fundo do Mar Dourado', 'kit-brincos-fundo-do-mar-dourado-129', 'Kit Brincos Fundo do Mar Dourado - Semi-joias', 64.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798002259-dsyfkd.jpeg"]'::jsonb, 1, 0, 10, 128)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (130, 'Brinco Argola Gota Dourado', 'brinco-argola-gota-dourado-130', 'Brinco Argola Gota Dourado - Semi-joias', 65, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798002499-pshx93.jpeg"]'::jsonb, 1, 0, 10, 129)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (131, 'Brinco Trio', 'brinco-trio-131', 'Brinco Trio - Semi-joias', 79.99, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798002714-1qg10h.jpeg"]'::jsonb, 1, 0, 10, 130)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (132, 'Brinco Sol', 'brinco-sol-132', 'Brinco Sol - Semi-joias', 49.99, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798002974-vlytxw.jpeg"]'::jsonb, 1, 0, 10, 131)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (133, 'Brinco Argola Cravejada', 'brinco-argola-cravejada-133', 'Brinco Argola Cravejada - Semi-joias', 55, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798003246-5gigag.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798003341-bq5cto.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798003455-aplew9.jpeg"]'::jsonb, 1, 0, 10, 132)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (134, 'Brinco Coração Cravejado', 'brinco-coracao-cravejado-134', 'Brinco Coração Cravejado - Semi-joias', 55, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798003662-f4n4x.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798003826-t4pqim.jpeg"]'::jsonb, 1, 0, 10, 133)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (135, 'Brinco Flor Dourada', 'brinco-flor-dourada-135', 'Brinco Flor Dourada - Semi-joias', 55, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798004073-p6jqf.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798004212-de8ivb.jpeg"]'::jsonb, 1, 1, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (136, 'Brinco Mandala Dourada Mini', 'brinco-mandala-dourada-mini-136', 'Brinco Mandala Dourada Mini - Semi-joias', 48.99, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798004461-9qt41d.jpeg","https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798004558-322zgm.jpeg"]'::jsonb, 1, 0, 10, 135)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (137, 'Brincos Dupla', 'brincos-dupla-137', 'Brincos Dupla - Semi-joias', 69.99, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798004844-prbsd.jpeg"]'::jsonb, 1, 0, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (138, 'Conjunto Arco-íris', 'conjunto-arco-iris-138', 'Conjunto Arco-íris - Semi-joias', 60, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798005139-ka0sem.jpeg"]'::jsonb, 1, 0, 10, 137)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (139, 'Conjunto Cupcake', 'conjunto-cupcake-139', 'Conjunto Cupcake - Semi-joias', 60, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798005394-7kti8.jpeg"]'::jsonb, 1, 0, 10, 138)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (140, 'Conjunto Joaninha', 'conjunto-joaninha-140', 'Conjunto Joaninha - Semi-joias', 65, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798005618-phos09.jpeg"]'::jsonb, 1, 0, 10, 139)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (141, 'Conjunto Panda', 'conjunto-panda-141', 'Conjunto Panda - Semi-joias', 60, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798005854-ge4slc.jpeg"]'::jsonb, 1, 0, 10, 140)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (142, 'Conjunto Princesa', 'conjunto-princesa-142', 'Conjunto Princesa - Semi-joias', 60, NULL, 'Semi-joias', 'Semijoias', 'Conjuntos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798006073-jnhhsf.jpeg"]'::jsonb, 1, 0, 10, 141)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (143, 'Dupla Brinco', 'dupla-brinco-143', 'Dupla Brinco - Semi-joias', 62.9, NULL, 'Semi-joias', 'Semijoias', 'Brincos', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798006297-gjrfj7.jpeg"]'::jsonb, 1, 0, 10, 142)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (144, 'Pulseira Perolada', 'pulseira-perolada-144', 'Pulseira Perolada - Semi-joias', 40, NULL, 'Semi-joias', 'Semijoias', 'Pulseiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798006567-n4ke9f.jpeg"]'::jsonb, 1, 0, 10, 143)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (145, 'Tornozeleira Estrelas e Ponto de Luz Dourada', 'tornozeleira-estrelas-e-ponto-de-luz-dourada-145', 'Tornozeleira Estrelas e Ponto de Luz Dourada - Tornozeleiras', 52.99, NULL, 'Tornozeleiras', 'Semijoias', 'Tornozeleiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798006822-hghg8do.jpeg"]'::jsonb, 1, 0, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (146, 'Tornozeleira Coração e Flecha Dourada', 'tornozeleira-coracao-e-flecha-dourada-146', 'Tornozeleira Coração e Flecha Dourada - Tornozeleiras', 52.99, NULL, 'Tornozeleiras', 'Semijoias', 'Tornozeleiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798007071-s41226.jpeg"]'::jsonb, 1, 0, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (147, 'Tornozeleira Lua e Estrelas Prata', 'tornozeleira-lua-e-estrelas-prata-147', 'Tornozeleira Lua e Estrelas Prata - Tornozeleiras', 48.99, NULL, 'Tornozeleiras', 'Semijoias', 'Tornozeleiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798007305-opkq2a.jpeg"]'::jsonb, 1, 0, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (148, 'Tornozeleira Estrelas e Lua Dourada', 'tornozeleira-estrelas-e-lua-dourada-148', 'Tornozeleira Estrelas e Lua Dourada - Tornozeleiras', 52.99, NULL, 'Tornozeleiras', 'Semijoias', 'Tornozeleiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798007563-73rlaa.jpeg"]'::jsonb, 1, 0, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (149, 'Tornozeleira Avião Ponto de Luz Prata', 'tornozeleira-aviao-ponto-de-luz-prata-149', 'Tornozeleira Avião Ponto de Luz Prata - Tornozeleiras', 48.89, NULL, 'Tornozeleiras', 'Semijoias', 'Tornozeleiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-1771798007818-hazqrh.jpeg"]'::jsonb, 1, 0, 10, 0)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";

INSERT INTO "products" ("id", "name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock", "displayOrder") 
VALUES (150, 'Tornozeleira Estrela do Mar e Medalha Dourada', 'tornozeleira-estrela-mar-medalha-dourada-150', 'Tornozeleira Estrela do Mar e Medalha Dourada - Tornozeleiras', 52.99, NULL, 'Tornozeleiras', 'Semijoias', 'Tornozeleiras', '["https://d2xsxph8kpxj0f.cloudfront.net/310519663375106961/GPamvdx6wVX77JTv6T2hp9/products/catalog-tornozeleira-fix-1771798022041.jpeg"]'::jsonb, 1, 0, 10, 149)
ON CONFLICT ("slug") DO UPDATE SET 
"name" = EXCLUDED."name", "price" = EXCLUDED."price", "images" = EXCLUDED."images", "active" = EXCLUDED."active", "stock" = EXCLUDED."stock";


-- Atualizando as Sequences (Autoincrement) para evitar conflitos futuros
SELECT setval(pg_get_serial_sequence('categories', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM categories;
SELECT setval(pg_get_serial_sequence('products', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM products;

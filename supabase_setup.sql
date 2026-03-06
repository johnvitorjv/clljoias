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
-- Ativa a segurança nas tabelas do catálogo
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;

-- Permite que qualquer usuário (anônimo público ou logado) possa LER (SELECT) o catálogo
CREATE POLICY "Leitura_publica_categorias" ON "categories" FOR SELECT USING (true);
CREATE POLICY "Leitura_publica_produtos" ON "products" FOR SELECT USING (true);


-- 3. SEED DE DADOS MOCKADOS (População Básica)
-- Inserindo categorias iniciais
INSERT INTO "categories" ("name", "slug", "description", "active") VALUES
('Anéis', 'aneis', 'Anéis em Prata 925 e Banhados', 1),
('Brincos', 'brincos', 'Brincos diversos e argolas', 1),
('Colares', 'colares', 'Colares, correntes e gargantilhas', 1),
('Pulseiras', 'pulseiras', 'Pulseiras em Prata 925 e Banhadas', 1)
ON CONFLICT ("slug") DO NOTHING;

-- Inserindo alguns produtos mockados para o site não ficar vazio
INSERT INTO "products" ("name", "slug", "description", "price", "originalPrice", "categoryLine", "material", "accessoryType", "images", "active", "featured", "stock") VALUES
('Anel Solitário Prata 925', 'anel-solitario-prata-925', 'Lindo anel solitário em Prata 925 autêntica, com zircônia cravejada. Peça delicada e luxuosa para qualquer ocasião.', 129.90, 159.90, 'aneis', 'Prata 925', 'Anel', '[]', 1, 1, 10),
('Colar Ponto de Luz Ouro', 'colar-ponto-de-luz', 'Colar clássico ponto de luz banhado a ouro 18k. Um toque de brilho sutil para o seu dia a dia.', 89.90, NULL, 'colares', 'Banhado a Ouro', 'Colar', '[]', 1, 1, 15),
('Brinco Argola Fina', 'brinco-argola-fina', 'Brinco de argola fina média em prata 925. O acessório indispensável no porta-joias.', 69.90, NULL, 'brincos', 'Prata 925', 'Brinco', '[]', 1, 0, 20),
('Pulseira Riviera', 'pulseira-riviera', 'Pulseira estilo riviera com zircônias coloridas banhada a ouro 18k.', 199.90, 249.90, 'pulseiras', 'Banhado a Ouro', 'Pulseira', '[]', 1, 1, 5)
ON CONFLICT ("slug") DO NOTHING;

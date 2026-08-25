import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { FREE_SHIPPING_THRESHOLD, LOCAL_CITIES, ADMIN_COOKIE_NAME, validateCPF, validateEmail, validatePhone } from "@shared/types";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { generateImage } from "./_core/imageGeneration";

// Admin middleware that checks either OAuth admin role OR admin password cookie
const adminMiddleware = router({}).createCaller; // placeholder
function isAdminRequest(ctx: any): boolean {
  // Check OAuth user role
  if (ctx.user?.role === "admin") return true;
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const expectedToken = Buffer.from(expected).toString("base64");
  // Check Authorization header (works on Safari iOS where cookies are blocked by ITP)
  const authHeader = ctx.req?.headers?.authorization || "";
  if (authHeader.startsWith("Bearer ") && authHeader.slice(7) === expectedToken) return true;
  // Check admin password cookie (fallback for browsers that support cross-site cookies)
  const cookies = ctx.req?.headers?.cookie || "";
  const adminCookie = cookies.split(";").map((c: string) => c.trim()).find((c: string) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
  if (adminCookie) {
    const value = adminCookie.split("=")[1];
    if (value === expectedToken) return true;
  }
  return false;
}

// Custom admin procedure that supports both OAuth admin and password cookie
// adminProcedureCustom not needed - using isAdminRequest() inline checks instead

// Regras de frete (Bahia apenas). Extraída para ser reutilizável e reexecutável
// server-side em orders.create, para impedir que o cliente informe um shippingPrice arbitrário.
type ShippingQuoteResult = {
  city?: string;
  state?: string;
  isLocal?: boolean;
  unavailable?: boolean;
  unavailableMessage?: string;
  error?: string;
  options: Array<{ method: string; label: string; price: number; days?: number; description?: string }>;
};

async function computeShippingQuote(rawCep: string, weightGrams: number): Promise<ShippingQuoteResult> {
  const cleanCep = rawCep.replace(/\D/g, "");
  try {
    const viacepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const viacepData = await viacepRes.json() as any;
    if (viacepData.erro) return { error: "CEP não encontrado", options: [], unavailable: false };
    const city = viacepData.localidade || "";
    const state = viacepData.uf || "";

    // Só entregamos na Bahia
    if (state !== "BA") {
      return {
        city, state, isLocal: false, options: [],
        unavailable: true,
        unavailableMessage: `Infelizmente ainda não entregamos em ${city}/${state}. No momento, realizamos entregas apenas na Bahia. Entre em contato pelo WhatsApp para tirar dúvidas!`,
      };
    }

    const isLocal = LOCAL_CITIES.some(c => city.toLowerCase().includes(c.toLowerCase()));
    if (isLocal) {
      return {
        city, state, isLocal: true, unavailable: false,
        options: [
          { method: "retirada", label: "Retirada Presencial", price: 0, description: "A combinar via WhatsApp" },
          { method: "entrega_local", label: "Uber Flash / Entrega Local", price: 0, description: "Taxa a combinar via WhatsApp" },
        ],
      };
    }
    // Entrega dentro da Bahia (fora de Salvador)
    const weight = Math.max(weightGrams / 1000, 0.3);
    const basePac = 15.90 + weight * 4.5;
    const baseSedex = 28.90 + weight * 7.5;
    const pacDays = 8;
    const sedexDays = 4;
    const pacPrice = Math.round(basePac * 100) / 100;
    const sedexPrice = Math.round(baseSedex * 100) / 100;

    const options = [
      { method: "pac", label: "PAC", price: pacPrice, days: pacDays, description: `Entrega em ${pacDays} dias úteis` },
      { method: "sedex", label: "SEDEX", price: sedexPrice, days: sedexDays, description: `Entrega em ${sedexDays} dias úteis` },
    ];

    return { city, state, isLocal: false, unavailable: false, options };
  } catch (err) {
    return { error: "Não foi possível calcular o frete. Tente novamente ou fale conosco no WhatsApp.", options: [] };
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      const categories = await db.getActiveCategories();
      if (categories.length === 0) {
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Categorias temporariamente indisponíveis." });
        }
      }
      return categories;
    }),
    listAll: publicProcedure.query(async ({ ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getAllCategories();
    }),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => db.getCategoryBySlug(input.slug)),
    create: publicProcedure.input(z.object({
      name: z.string().min(1), slug: z.string().min(1), description: z.string().optional(),
      image: z.string().optional(), displayOrder: z.number().default(0), active: z.number().default(1),
    })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      return { id: await db.createCategory(input) };
    }),
    update: publicProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), slug: z.string().optional(),
      description: z.string().optional(), image: z.string().optional(),
      displayOrder: z.number().optional(), active: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input; await db.updateCategory(id, data); return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      await db.deleteCategory(input.id); return { success: true };
    }),
  }),

  products: router({
    list: publicProcedure.query(async () => {
      const products = await db.getActiveProducts();
      if (products.length === 0) {
        // Verificar se banco está indisponível
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Catálogo temporariamente indisponível. Tente novamente em alguns minutos." });
        }
      }
      return products;
    }),
    listAll: publicProcedure.query(async ({ ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getAllProducts();
    }),
    featured: publicProcedure.query(async () => {
      const products = await db.getFeaturedProducts();
      if (products.length === 0) {
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Catálogo temporariamente indisponível. Tente novamente em alguns minutos." });
        }
      }
      return products;
    }),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const product = await db.getProductBySlug(input.slug);
      if (!product) {
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Serviço temporariamente indisponível." });
        }
      }
      return product;
    }),
    byCategory: publicProcedure.input(z.object({ categoryLine: z.string() })).query(async ({ input }) => db.getProductsByCategory(input.categoryLine)),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      if (!input.query.trim()) return [];
      return db.searchProducts(input.query);
    }),
    create: publicProcedure.input(z.object({
      name: z.string().min(1), slug: z.string().min(1), description: z.string().optional(),
      price: z.string(), originalPrice: z.string().optional(), discountPercent: z.number().default(0),
      categoryLine: z.string(), material: z.string(), accessoryType: z.string(),
      images: z.array(z.string()).optional(), featured: z.number().default(0), active: z.number().default(1),
      stock: z.number().optional(), displayOrder: z.number().default(0),
      weightGrams: z.number().optional(), lengthCm: z.number().optional(),
      widthCm: z.number().optional(), heightCm: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await db.createProduct({ ...input, images: input.images ?? [] });
      return { id };
    }),
    update: publicProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), slug: z.string().optional(),
      description: z.string().optional(), price: z.string().optional(),
      originalPrice: z.string().optional().nullable(), discountPercent: z.number().optional(),
      categoryLine: z.string().optional(), material: z.string().optional(), accessoryType: z.string().optional(),
      images: z.array(z.string()).optional(), featured: z.number().optional(), active: z.number().optional(),
      stock: z.number().optional(), displayOrder: z.number().optional(),
      weightGrams: z.number().optional().nullable(), lengthCm: z.number().optional().nullable(),
      widthCm: z.number().optional().nullable(), heightCm: z.number().optional().nullable(),
    })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input; await db.updateProduct(id, data as any); return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      await db.deleteProduct(input.id); return { success: true };
    }),
    uploadMedia: publicProcedure.input(z.object({
      base64: z.string(), filename: z.string(), contentType: z.string().default("image/jpeg"),
    })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.filename.split(".").pop() || "jpg";
      const key = `products/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      const isVideo = input.contentType.startsWith("video/");
      return { url, type: isVideo ? "video" : "image" };
    }),
    // Keep old name for backwards compat
    uploadImage: publicProcedure.input(z.object({
      base64: z.string(), filename: z.string(), contentType: z.string().default("image/jpeg"),
    })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN", message: "Sessão admin inválida" });
      try {
        const cleanBase64 = input.base64.includes(",") ? input.base64.split(",").pop() || "" : input.base64;
        if (!cleanBase64) throw new TRPCError({ code: "BAD_REQUEST", message: "Imagem inválida" });

        // Validate MIME type - only allow safe image types
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const submittedMime = input.contentType?.toLowerCase().trim() || '';
        if (!allowedMimeTypes.some(t => submittedMime.includes(t))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Tipo de arquivo não permitido. Envie apenas imagens (JPEG, PNG, GIF, WebP)" });
        }

        // Validate magic bytes of the actual file content
        const buffer = Buffer.from(cleanBase64, "base64");
        if (buffer.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo vazio" });
        }

        // Check magic bytes to prevent polyglot attacks (file claiming to be image but containing malicious content)
        const headerHex = buffer.slice(0, 12).toString("hex");
        const isJpeg = headerHex.startsWith("ffd8ff");
        const isPng = headerHex.startsWith("89504e47");
        const isGif = headerHex.startsWith("47494638");
        const isWebp = headerHex.startsWith("52494646"); // RIFF header

        // Extrair extensão real do magic bytes, não do nome enviado pelo cliente
        let realExt = "jpg";
        if (isJpeg) realExt = "jpg";
        else if (isPng) realExt = "png";
        else if (isGif) realExt = "gif";
        else if (isWebp) realExt = "webp";
        else {
          console.error("[products.uploadImage] Invalid magic bytes:", headerHex);
          throw new TRPCError({ code: "BAD_REQUEST", message: "O conteúdo do arquivo não é uma imagem válida" });
        }

        // Nome gerado no servidor com nanoid - evita path traversal e nome malicioso
        const key = `products/${nanoid()}.${realExt}`;
        const safeContentType = `image/${realExt}`;
        const { url } = await storagePut(key, buffer, safeContentType);
        return { url };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        console.error("[products.uploadImage]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message || "Falha no upload da imagem" });
      }
    }),
    generateImage: publicProcedure.input(z.object({ prompt: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      const result = await generateImage({ prompt: input.prompt });
      return { url: result.url };
    }),
  }),

  shipping: router({
    quote: publicProcedure.input(z.object({
      cep: z.string().min(8).max(9), weightGrams: z.number().default(200),
    })).mutation(async ({ input }) => {
      return computeShippingQuote(input.cep, input.weightGrams);
    }),
  }),

  orders: router({
    create: publicProcedure.input(z.object({
      customerName: z.string().min(1),
      customerCpf: z.string().min(1),
      customerEmail: z.string().min(1),
      customerPhone: z.string().min(1),
      shippingMethod: z.string().optional(),
      shippingCep: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(), quantity: z.number().min(1),
      })),
    })).mutation(async ({ input, ctx }) => {
      // Validate fields
      if (!validateEmail(input.customerEmail)) throw new TRPCError({ code: "BAD_REQUEST", message: "Email inválido" });
      if (!validateCPF(input.customerCpf)) throw new TRPCError({ code: "BAD_REQUEST", message: "CPF inválido" });
      if (!validatePhone(input.customerPhone)) throw new TRPCError({ code: "BAD_REQUEST", message: "Telefone inválido" });

      // CRÍTICO: Buscar produtos do banco para evitar manipulação de preços
      const productIds = input.items.map(i => i.productId);
      const products = await db.getProductsByIds(productIds);
      const productMap = new Map(products.map(p => [p.id, p]));

      // Validar que todos os produtos existem e estão ativos
      const invalidProducts: number[] = [];
      const orderItems: Array<{ productId: number; productName: string; quantity: number; price: string }> = [];
      let totalWeightGrams = 0;

      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          invalidProducts.push(item.productId);
          continue;
        }
        if (product.active !== 1) {
          invalidProducts.push(item.productId);
          continue;
        }
        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price, // Usar preço real do banco
        });
        totalWeightGrams += (product.weightGrams ?? 200) * item.quantity;
      }

      if (invalidProducts.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Produtos inválidos: ${invalidProducts.join(", ")}` });
      }

      if (orderItems.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido deve ter pelo menos um produto" });
      }

      // Recalcular subtotal server-side
      const serverSubtotal = orderItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + (price * item.quantity);
      }, 0);

      // CRÍTICO: Frete nunca é aceito do cliente. O método escolhido é revalidado
      // contra a cotação recalculada no servidor (mesma fonte usada por shipping.quote),
      // e o preço usado é sempre o do servidor - nunca um valor enviado pelo navegador.
      let serverShipping = 0;
      if (input.shippingMethod) {
        if (!input.shippingCep) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CEP de entrega é obrigatório para calcular o frete" });
        }
        const quote = await computeShippingQuote(input.shippingCep, totalWeightGrams);
        if (quote.unavailable || quote.error || !quote.options.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível calcular frete para este CEP" });
        }
        const matchedOption = quote.options.find(opt => opt.method === input.shippingMethod);
        if (!matchedOption) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Método de frete inválido para este CEP" });
        }
        const freeShipping = serverSubtotal >= FREE_SHIPPING_THRESHOLD && matchedOption.price > 0;
        serverShipping = freeShipping ? 0 : matchedOption.price;
      }

      // Recalcular total server-side (subtotal + frete), ambos calculados acima a partir de dados confiáveis
      const serverTotal = serverSubtotal + serverShipping;

      const paymentId = nanoid(20);
      const orderId = await db.createOrder({
        userId: ctx.user?.id, customerName: input.customerName, customerCpf: input.customerCpf,
        customerEmail: input.customerEmail, customerPhone: input.customerPhone,
        shippingMethod: input.shippingMethod, shippingPrice: serverShipping.toFixed(2),
        shippingCep: input.shippingCep, subtotal: serverSubtotal.toFixed(2), total: serverTotal.toFixed(2),
        notes: input.notes, paymentId, status: "pending",
      });
      await db.createOrderItems(orderItems.map(item => ({
        orderId, productId: item.productId, productName: item.productName,
        quantity: item.quantity, price: item.price,
      })));
      try {
        const itemsList = orderItems.map(i => `${i.quantity}x ${i.productName} - R$${i.price}`).join("\n");
        await notifyOwner({
          title: `Novo Pedido #${orderId} - CLL JOIAS`,
          content: `Novo pedido recebido!\n\nCliente: ${input.customerName}\nEmail: ${input.customerEmail || "N/A"}\nTelefone: ${input.customerPhone || "N/A"}\nCPF: ${input.customerCpf || "N/A"}\n\nItens:\n${itemsList}\n\nSubtotal: R$${serverSubtotal.toFixed(2)}\nFrete: R$${serverShipping.toFixed(2)} (${input.shippingMethod || "N/A"})\nTotal: R$${serverTotal.toFixed(2)}`,
        });
      } catch (e) { console.warn("Failed to notify owner:", e); }
      return { orderId, paymentId, serverTotal: serverTotal.toFixed(2) };
    }),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const order = await db.getOrderById(input.id);
      if (!order) return null;
      const items = await db.getOrderItems(input.id);
      return { ...order, items };
    }),
    myOrders: protectedProcedure.query(async ({ ctx }) => db.getOrdersByUserId(ctx.user.id)),
    listAll: publicProcedure.query(async ({ ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getAllOrders();
    }),
    updateStatus: publicProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ input, ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      await db.updateOrderStatus(input.id, input.status);
      return { success: true };
    }),
  }),

  admin: router({
    login: publicProcedure.input(z.object({ password: z.string() })).mutation(async ({ input, ctx }) => {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        console.error("[Admin] ADMIN_PASSWORD não configurado no servidor");
        return { success: false, error: "Senha incorreta" };
      }
      if (input.password !== adminPassword) {
        // Log para detecção de brute force (sem expor se senha está configurada)
        console.warn(`[Admin] Tentativa de login falhou de ${ctx.req?.headers?.['x-forwarded-for'] || ctx.req?.socket?.remoteAddress || 'unknown'}`);
        return { success: false, error: "Senha incorreta" };
      }
      // Set admin cookie (cross-origin compatible)
      const cookieValue = Buffer.from(adminPassword).toString("base64");
      const isSecure = ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https";
      ctx.res.cookie(ADMIN_COOKIE_NAME, cookieValue, {
        httpOnly: true,
        path: "/",
        sameSite: isSecure ? "none" : "lax",
        secure: isSecure,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
      return { success: true, token: cookieValue };
    }),
    checkAuth: publicProcedure.query(async ({ ctx }) => {
      return { isAdmin: isAdminRequest(ctx) };
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
      return { success: true };
    }),
    stats: publicProcedure.query(async ({ ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      const allProducts = await db.getAllProducts();
      const allOrders = await db.getAllOrders();
      const approvedOrders = allOrders.filter(o => o.status === "approved" || o.status === "delivered" || o.status === "shipped");
      const totalRevenue = approvedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
      return {
        totalProducts: allProducts.length, activeProducts: allProducts.filter(p => p.active === 1).length,
        totalOrders: allOrders.length, pendingOrders: allOrders.filter(o => o.status === "pending").length,
        approvedOrders: approvedOrders.length, totalRevenue: Math.round(totalRevenue * 100) / 100,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

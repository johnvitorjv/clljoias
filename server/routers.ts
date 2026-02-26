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
  // Check admin password cookie
  const cookies = ctx.req?.headers?.cookie || "";
  const adminCookie = cookies.split(";").map((c: string) => c.trim()).find((c: string) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
  if (adminCookie) {
    const value = adminCookie.split("=")[1];
    const expected = process.env.ADMIN_PASSWORD;
    if (expected && value === Buffer.from(expected).toString("base64")) return true;
  }
  return false;
}

// Custom admin procedure that supports both OAuth admin and password cookie
// adminProcedureCustom not needed - using isAdminRequest() inline checks instead

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
    list: publicProcedure.query(async () => db.getActiveCategories()),
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
    list: publicProcedure.query(async () => db.getActiveProducts()),
    listAll: publicProcedure.query(async ({ ctx }) => {
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getAllProducts();
    }),
    featured: publicProcedure.query(async () => db.getFeaturedProducts()),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => db.getProductBySlug(input.slug)),
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
      if (!isAdminRequest(ctx)) throw new TRPCError({ code: "FORBIDDEN" });
      const buffer = Buffer.from(input.base64, "base64");
      const key = `products/${nanoid()}-${input.filename}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url };
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
      const cleanCep = input.cep.replace(/\D/g, "");
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
            unavailableMessage: `Infelizmente ainda n\u00e3o entregamos em ${city}/${state}. No momento, realizamos entregas apenas na Bahia. Entre em contato pelo WhatsApp para tirar d\u00favidas!`,
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
        const weight = Math.max(input.weightGrams / 1000, 0.3);
        const basePac = 15.90 + weight * 4.5;
        const baseSedex = 28.90 + weight * 7.5;
        const pacDays = 8;
        const sedexDays = 4;
        const pacPrice = Math.round(basePac * 100) / 100;
        const sedexPrice = Math.round(baseSedex * 100) / 100;
        
        const options: any[] = [
          { method: "pac", label: "PAC", price: pacPrice, days: pacDays, description: `Entrega em ${pacDays} dias \u00fateis` },
          { method: "sedex", label: "SEDEX", price: sedexPrice, days: sedexDays, description: `Entrega em ${sedexDays} dias \u00fateis` },
        ];
        
        return { city, state, isLocal: false, unavailable: false, options };
      } catch (err) {
        return { error: "Não foi possível calcular o frete. Tente novamente ou fale conosco no WhatsApp.", options: [] };
      }
    }),
  }),

  orders: router({
    create: publicProcedure.input(z.object({
      customerName: z.string().min(1),
      customerCpf: z.string().min(1),
      customerEmail: z.string().min(1),
      customerPhone: z.string().min(1),
      shippingMethod: z.string().optional(),
      shippingPrice: z.string().default("0"),
      shippingCep: z.string().optional(),
      subtotal: z.string(),
      total: z.string(),
      notes: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(), productName: z.string(), quantity: z.number().min(1),
        price: z.string(), notes: z.string().optional(),
      })),
    })).mutation(async ({ input, ctx }) => {
      // Validate fields
      if (!validateEmail(input.customerEmail)) throw new TRPCError({ code: "BAD_REQUEST", message: "Email inválido" });
      if (!validateCPF(input.customerCpf)) throw new TRPCError({ code: "BAD_REQUEST", message: "CPF inválido" });
      if (!validatePhone(input.customerPhone)) throw new TRPCError({ code: "BAD_REQUEST", message: "Telefone inválido" });

      const paymentId = nanoid(20);
      const orderId = await db.createOrder({
        userId: ctx.user?.id, customerName: input.customerName, customerCpf: input.customerCpf,
        customerEmail: input.customerEmail, customerPhone: input.customerPhone,
        shippingMethod: input.shippingMethod, shippingPrice: input.shippingPrice,
        shippingCep: input.shippingCep, subtotal: input.subtotal, total: input.total,
        notes: input.notes, paymentId, status: "pending",
      });
      await db.createOrderItems(input.items.map(item => ({
        orderId, productId: item.productId, productName: item.productName,
        quantity: item.quantity, price: item.price, notes: item.notes,
      })));
      try {
        const itemsList = input.items.map(i => `${i.quantity}x ${i.productName} - R$${i.price}`).join("\n");
        await notifyOwner({
          title: `Novo Pedido #${orderId} - CLL JOIAS`,
          content: `Novo pedido recebido!\n\nCliente: ${input.customerName}\nEmail: ${input.customerEmail || "N/A"}\nTelefone: ${input.customerPhone || "N/A"}\nCPF: ${input.customerCpf || "N/A"}\n\nItens:\n${itemsList}\n\nSubtotal: R$${input.subtotal}\nFrete: R$${input.shippingPrice} (${input.shippingMethod || "N/A"})\nTotal: R$${input.total}`,
        });
      } catch (e) { console.warn("Failed to notify owner:", e); }
      return { orderId, paymentId };
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
      if (!adminPassword || input.password !== adminPassword) return { success: false, error: "Senha incorreta" };
      // Set admin cookie
      const cookieValue = Buffer.from(adminPassword).toString("base64");
      ctx.res.cookie(ADMIN_COOKIE_NAME, cookieValue, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: ctx.req.protocol === "https" || ctx.req.headers["x-forwarded-proto"] === "https",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
      return { success: true };
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

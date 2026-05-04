import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import crypto from "crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { z } from "zod";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

// CORS middleware for cross-origin requests (Cloudflare Pages -> Render)
function corsMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}

const sensitiveRouteLimits: Record<string, { windowMs: number; max: number }> = {
  "/api/process-payment": { windowMs: 60_000, max: 20 },
  "/api/mp-webhook": { windowMs: 60_000, max: 60 },
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: express.Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff[0]) return xff[0];
  return req.ip || req.socket.remoteAddress || "unknown";
}

function sensitiveRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const routeLimit = sensitiveRouteLimits[req.path];
  if (!routeLimit) return next();
  const ip = getClientIp(req);
  const key = `${req.path}:${ip}`;
  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + routeLimit.windowMs });
    return next();
  }

  if (current.count >= routeLimit.max) {
    console.warn("[SECURITY] Rate limit exceeded", { route: req.path, ip, method: req.method });
    return res.status(429).json({ error: "too_many_requests" });
  }

  current.count += 1;
  return next();
}

const processPaymentSchema = z.object({
  orderId: z.union([z.string(), z.number()]).transform(v => String(v).trim()).refine(v => v.length > 0),
  description: z.string().max(255).optional(),
  external_reference: z.union([z.string(), z.number()]).optional().transform(v => (v == null ? undefined : String(v))),
  formData: z.object({
    transaction_amount: z.coerce.number().positive(),
    token: z.string().min(8),
    installments: z.coerce.number().int().min(1).max(24).optional(),
    payment_method_id: z.string().min(2).max(40),
    issuer_id: z.union([z.string(), z.number()]).optional(),
    payer: z.object({
      email: z.string().email(),
      identification: z.object({
        type: z.string().min(2).max(10),
        number: z.string().min(5).max(32),
      }),
    }),
  }),
}).strict();

const mpWebhookSchema = z.object({
  type: z.string(),
  data: z.object({ id: z.union([z.string(), z.number()]) }).optional(),
}).passthrough();

function maskEmail(email?: string): string | undefined {
  if (!email || !email.includes("@")) return undefined;
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function verifyMercadoPagoWebhookSignature(req: express.Request): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return false;
  const signatureHeader = String(req.headers["x-signature"] || "");
  const requestId = String(req.headers["x-request-id"] || "");
  const dataId = String(req.query["data.id"] || req.query.id || req.body?.data?.id || "");
  if (!signatureHeader || !requestId || !dataId) return false;

  const parts = Object.fromEntries(signatureHeader.split(",").map(chunk => chunk.trim().split("=")));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(corsMiddleware);
  app.use(sensitiveRateLimit);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Mercado Pago payment processing endpoint
  app.post("/api/process-payment", async (req, res) => {
    try {
      const parsed = processPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        console.warn("[SECURITY] Invalid process-payment payload", {
          route: req.path,
          ip: getClientIp(req),
          issues: parsed.error.issues.map(issue => issue.path.join(".")),
        });
        return res.status(400).json({ error: "invalid_payload" });
      }

      const { orderId, formData, description, external_reference } = parsed.data;
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!accessToken) {
        console.error("[MP] ERRO CRÍTICO: MERCADO_PAGO_ACCESS_TOKEN não configurado");
        return res.status(500).json({ error: "payment_error", message: "Configuração de pagamento incompleta no servidor" });
      }

      // Validar dados obrigatórios do formData
      if (!formData) {
        console.error("[MP] ERRO: formData vazio na request");
        return res.status(400).json({ error: "payment_error", message: "Dados do pagamento não recebidos" });
      }

      // Build payment body for Mercado Pago API
      const paymentBody: any = {
        transaction_amount: Number(formData.transaction_amount),
        token: formData.token,
        description: description || `CLL JOIAS - Pedido #${orderId}`,
        installments: Number(formData.installments) || 1,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id ? String(formData.issuer_id) : undefined,
        external_reference: external_reference ? String(external_reference) : undefined,
        payer: {
          email: formData.payer?.email,
          identification: formData.payer?.identification,
        },
      };

      // LOG: payload enviado ao MP (sem dados sensíveis)
      console.log(`[MP] Pedido #${orderId} — Enviando pagamento:`, JSON.stringify({
        transaction_amount: paymentBody.transaction_amount,
        payment_method_id: paymentBody.payment_method_id,
        installments: paymentBody.installments,
        issuer_id: paymentBody.issuer_id,
        has_token: !!paymentBody.token,
        payer_email: maskEmail(paymentBody.payer?.email),
        payer_identification: paymentBody.payer?.identification,
      }));

      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "X-Idempotency-Key": `order-${orderId}-${Date.now()}`,
        },
        body: JSON.stringify(paymentBody),
      });

      const mpResult = await mpResponse.json() as any;

      // LOG: resposta completa do MP
      console.log(`[MP] Pedido #${orderId} — Resposta HTTP ${mpResponse.status}:`, JSON.stringify({
        status: mpResult.status,
        status_detail: mpResult.status_detail,
        id: mpResult.id,
        error: mpResult.error,
        message: mpResult.message,
        cause: mpResult.cause,
      }));

      // VERIFICAR: o MP retornou erro de API (não é um pagamento válido)
      if (!mpResponse.ok || !mpResult.status) {
        console.error(`[MP] ERRO DE INTEGRAÇÃO para pedido #${orderId}:`, JSON.stringify(mpResult));
        // Atualizar ordem como rejeitada se houver ID
        if (mpResult.id) {
          const { updateOrderStatus } = await import("../db");
          await updateOrderStatus(orderId, "rejected", String(mpResult.id));
        }
        return res.status(400).json({
          error: "payment_error",
          message: mpResult.message || "Erro ao processar pagamento no gateway",
          cause: mpResult.cause,
          status: mpResult.status || "error",
          status_detail: mpResult.status_detail || mpResult.error || "integration_error",
        });
      }

      // Update order status based on payment result
      const { updateOrderStatus } = await import("../db");
      if (mpResult.status === "approved") {
        await updateOrderStatus(orderId, "approved", String(mpResult.id));
      } else if (mpResult.status === "pending" || mpResult.status === "in_process") {
        await updateOrderStatus(orderId, "pending", String(mpResult.id));
      } else if (mpResult.status === "rejected") {
        await updateOrderStatus(orderId, "rejected", String(mpResult.id));
      }

      return res.json({
        status: mpResult.status,
        status_detail: mpResult.status_detail,
        id: mpResult.id,
      });
    } catch (error: any) {
      console.error("[MP] EXCEÇÃO no processamento:", error);
      return res.status(500).json({ error: "payment_error", message: "Falha interna ao processar pagamento", details: error.message });
    }
  });

  // Mercado Pago webhook endpoint
  app.post("/api/mp-webhook", async (req, res) => {
    try {
      const parsed = mpWebhookSchema.safeParse(req.body);
      if (!parsed.success) {
        console.warn("[SECURITY] Invalid mp-webhook payload", { route: req.path, ip: getClientIp(req) });
        return res.sendStatus(200);
      }

      if (!verifyMercadoPagoWebhookSignature(req)) {
        console.warn("[SECURITY] Invalid Mercado Pago webhook signature", {
          route: req.path,
          ip: getClientIp(req),
          hasRequestId: !!req.headers["x-request-id"],
          hasSignature: !!req.headers["x-signature"],
        });
        return res.sendStatus(200);
      }

      const { type, data } = parsed.data;
      if (type === "payment") {
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!accessToken) return res.sendStatus(200);

        const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
          headers: { "Authorization": `Bearer ${accessToken}` },
        });
        const payment = await paymentRes.json() as any;

        if (payment.external_reference) {
          const { getOrderByPaymentId, updateOrderStatus } = await import("../db");
          const order = await getOrderByPaymentId(payment.external_reference);
          if (order) {
            const statusMap: Record<string, string> = {
              approved: "approved",
              pending: "pending",
              in_process: "pending",
              rejected: "rejected",
              cancelled: "cancelled",
              refunded: "cancelled",
            };
            const newStatus = statusMap[payment.status] || "pending";
            await updateOrderStatus(order.id, newStatus, String(payment.id));
          }
        }
      }
      return res.sendStatus(200);
    } catch (error) {
      console.error("Webhook error:", error);
      return res.sendStatus(200);
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
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
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Mercado Pago payment processing endpoint
  app.post("/api/process-payment", async (req, res) => {
    try {
      const { orderId, formData, description, external_reference } = req.body;
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!accessToken) {
        return res.status(500).json({ error: "MP_ACCESS_TOKEN not configured" });
      }

      // Build payment body for Mercado Pago API
      const paymentBody: any = {
        transaction_amount: formData.transaction_amount,
        token: formData.token,
        description: description || `CLL JOIAS - Pedido #${orderId}`,
        installments: formData.installments,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        external_reference: external_reference,
        payer: {
          email: formData.payer?.email,
          identification: formData.payer?.identification,
        },
      };

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

      // Update order status based on payment result
      if (mpResult.status === "approved") {
        const { updateOrderStatus } = await import("../db");
        await updateOrderStatus(orderId, "approved", String(mpResult.id));
      } else if (mpResult.status === "pending" || mpResult.status === "in_process") {
        const { updateOrderStatus } = await import("../db");
        await updateOrderStatus(orderId, "pending", String(mpResult.id));
      } else if (mpResult.status === "rejected") {
        const { updateOrderStatus } = await import("../db");
        await updateOrderStatus(orderId, "rejected", String(mpResult.id));
      }

      return res.json({
        status: mpResult.status,
        status_detail: mpResult.status_detail,
        id: mpResult.id,
      });
    } catch (error: any) {
      console.error("Payment processing error:", error);
      return res.status(500).json({ error: "Payment processing failed", details: error.message });
    }
  });

  // Mercado Pago webhook endpoint
  app.post("/api/mp-webhook", async (req, res) => {
    try {
      const { type, data } = req.body;
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

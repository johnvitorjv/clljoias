import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

// CORS middleware for cross-origin requests (Cloudflare Pages -> Render)
function corsMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const origin = req.headers.origin;
  if (origin) {
    // Em produção, verificar se origin está na whitelist configurada
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()) || [];
    const isWhitelisted = allowedOrigins.length > 0 && allowedOrigins.includes(origin);

    // Em desenvolvimento, permitir qualquer origin; em produção, só permitir se whitelist existir e origin estiver nela
    const isDev = process.env.NODE_ENV !== "production";
    if (isWhitelisted || isDev) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    }
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}

// Valida a assinatura oficial do webhook do Mercado Pago (HMAC-SHA256).
// Docs: https://www.mercadopago.com.br/developers/en/docs/checkout-api/webhooks
// O header x-signature vem no formato "ts=...,v1=..." e o manifest assinado é:
//   id:{data.id};request-id:{x-request-id};ts:{ts};
// (letras em data.id devem ser convertidas para minúsculas antes de montar o manifest)
function isValidMpWebhookSignature(params: {
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataId: string | undefined;
  secret: string;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;
  if (!xSignature || !xRequestId || !dataId) return false;

  const parts: Record<string, string> = {};
  for (const piece of xSignature.split(",")) {
    const [key, value] = piece.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expectedHex = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const expected = Buffer.from(expectedHex, "utf8");
  const received = Buffer.from(v1, "utf8");
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
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
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Mercado Pago payment processing endpoint
  app.post("/api/process-payment", async (req, res) => {
    try {
      const { orderId, formData, description, external_reference } = req.body;
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

      // CRÍTICO: Validar valor do pagamento buscando pedido no banco
      // IMPEDIR que atacante manipule o valor no navegador
      const { getOrderById, tryAcquirePaymentProcessingLock } = await import("../db");
      const order = await getOrderById(Number(orderId));
      if (!order) {
        console.error(`[MP] Pedido #${orderId} não encontrado`);
        return res.status(400).json({ error: "payment_error", message: "Pedido não encontrado" });
      }

      // CRÍTICO: Proteção contra pagamento duplicado. Se o pedido já foi aprovado
      // (por esta rota ou pelo webhook), não reenviar cobrança ao Mercado Pago.
      // Reutilizar o resultado já registrado evita cobrar o cliente duas vezes em
      // caso de retry de rede/duplo clique.
      if (order.status === "approved") {
        console.warn(`[MP] Pedido #${orderId} já está aprovado - ignorando nova tentativa de cobrança`);
        return res.json({
          status: "approved",
          status_detail: "already_approved",
          id: order.mpPaymentId || undefined,
        });
      }

      // CRÍTICO: Lock atômico contra concorrência. Duas requisições simultâneas para o
      // mesmo pedido (duplo clique, retry de rede, aba duplicada) não podem ambas passar
      // deste ponto: a aquisição do lock é um UPDATE condicional no banco (compare-and-set),
      // não um SELECT seguido de IF em memória - só uma delas recebe `true`. Ver
      // tryAcquirePaymentProcessingLock em server/db.ts para a explicação completa.
      // PROCESSING_LOCK_STALE_MS: se uma tentativa anterior travou (crash, timeout) sem
      // liberar o lock, uma nova tentativa pode adquiri-lo novamente após esse tempo -
      // evita bloqueio permanente do pedido.
      //
      // Este valor PRECISA ser maior que o pior tempo que uma primeira tentativa legítima
      // pode levar para concluir, senão uma segunda requisição poderia destravar o lock
      // (achando-o "abandonado") enquanto a primeira ainda está de fato cobrando no MP -
      // reabrindo a race condition que o lock existe para impedir. A única operação externa
      // de duração variável neste fluxo é o POST a api.mercadopago.com/v1/payments abaixo,
      // agora limitado a MP_PAYMENT_REQUEST_TIMEOUT_MS via AbortSignal.timeout. STALE_MS fica
      // acima desse timeout com margem de segurança para cobrir o tempo de rede/DB restante
      // (ler pedido, montar payload, gravar status) em torno da chamada.
      const MP_PAYMENT_REQUEST_TIMEOUT_MS = 20_000;
      const PROCESSING_LOCK_STALE_MS = 45_000;
      const acquiredLock = await tryAcquirePaymentProcessingLock(Number(orderId), PROCESSING_LOCK_STALE_MS);
      if (!acquiredLock) {
        console.warn(`[MP] Pedido #${orderId} já está em processamento (ou foi aprovado) - requisição concorrente rejeitada`);
        return res.status(409).json({
          error: "payment_error",
          message: "Este pedido já está sendo processado. Aguarde a confirmação antes de tentar novamente.",
          status: "in_process",
          status_detail: "concurrent_request_rejected",
        });
      }

      // Recalcular total do servidor para validar
      const serverSubtotal = parseFloat(order.subtotal || "0");
      const serverShipping = parseFloat(order.shippingPrice || "0");
      const serverTotal = serverSubtotal + serverShipping;

      // Validar que o valor enviado pelo navegador corresponde ao calculado no servidor
      const clientAmount = Number(formData.transaction_amount);
      if (isNaN(clientAmount) || clientAmount <= 0) {
        console.error(`[MP] Valor inválido: ${formData.transaction_amount}`);
        return res.status(400).json({ error: "payment_error", message: "Valor do pagamento inválido" });
      }

      // Diferença máxima tolerável: R$0.01 (para evitar problemas de floating point)
      const tolerance = 0.02;
      if (Math.abs(clientAmount - serverTotal) > tolerance) {
        console.error(`[MP] VALOR MANIPULADO! Cliente: ${clientAmount}, Servidor: ${serverTotal}, Pedido: #${orderId}`);
        return res.status(400).json({ error: "payment_error", message: "Valor do pagamento não corresponde ao pedido" });
      }

      // Build payment body for Mercado Pago API - usar valor do SERVIDOR, não do navegador
      const paymentBody: any = {
        transaction_amount: serverTotal, // Sempre usar valor validado do servidor
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
        payer_email: paymentBody.payer?.email,
        payer_identification: paymentBody.payer?.identification,
      }));

      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          // Idempotency key: usar orderId fixo para garantir reenvio da mesma request
          // Mesmo que MP retorne erro e cliente tente novamente, a mesma key garante retry seguro
          "X-Idempotency-Key": `cll-order-${orderId}`,
        },
        body: JSON.stringify(paymentBody),
        // Timeout explícito: sem isso a requisição poderia ficar pendente por muito mais
        // tempo que PROCESSING_LOCK_STALE_MS (limitada apenas pelo timeout de socket do
        // runtime), o que faria um segundo request destravar o lock enquanto esta primeira
        // tentativa ainda está legitimamente em andamento. Em caso de timeout, o fetch lança
        // AbortError, cai no catch abaixo, que loga, libera o lock (sem alterar o status do
        // pedido) e responde 500 - a mesma X-Idempotency-Key garante que um retry do cliente
        // não gere cobrança duplicada mesmo se a primeira chamada tiver de fato chegado ao MP.
        signal: AbortSignal.timeout(MP_PAYMENT_REQUEST_TIMEOUT_MS),
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
      // Liberar o lock em caso de exceção: updateOrderStatus (que já limpa processingSince)
      // pode não ter sido alcançado. Sem isso, uma falha inesperada aqui deixaria o pedido
      // bloqueado por até PROCESSING_LOCK_STALE_MS antes de permitir um novo retry.
      try {
        const { releasePaymentProcessingLock } = await import("../db");
        const { orderId: orderIdForCleanup } = req.body;
        if (orderIdForCleanup) await releasePaymentProcessingLock(Number(orderIdForCleanup));
      } catch (releaseError) {
        console.error("[MP] Falha ao liberar lock de processamento após exceção:", releaseError);
      }
      return res.status(500).json({ error: "payment_error", message: "Falha interna ao processar pagamento", details: error.message });
    }
  });

  // Mercado Pago webhook endpoint
  //
  // SEGURANÇA: a assinatura x-signature (HMAC-SHA256 sobre o manifest
  // "id:{data.id};request-id:{x-request-id};ts:{ts};", usando MERCADO_PAGO_WEBHOOK_SECRET)
  // é validada em isValidMpWebhookSignature() antes de qualquer processamento.
  // Notificação sem assinatura válida é rejeitada com 401 e o pedido não é consultado
  // nem alterado. Além disso, o corpo da notificação NUNCA é usado como fonte de verdade
  // para o status: buscamos o pagamento diretamente na API oficial do Mercado Pago usando
  // o `data.id` recebido, e é o resultado dessa consulta (não o body do POST) que determina
  // o novo status do pedido (ver CHECKOUT_SECURITY_REPORT.md).
  app.post("/api/mp-webhook", async (req, res) => {
    try {
      // SEGURANÇA: validar a assinatura oficial do Mercado Pago ANTES de processar
      // qualquer coisa. Sem isso, um atacante poderia forjar uma notificação apontando
      // para um data.id de pagamento real de outra pessoa (ver comentário histórico
      // removido acima e CHECKOUT_SECURITY_REPORT.md).
      const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
      if (!webhookSecret) {
        // Falhar de forma segura: nunca aceitar webhook não autenticado silenciosamente.
        console.error("[Webhook] ERRO CRÍTICO: MERCADO_PAGO_WEBHOOK_SECRET não configurado");
        return res.sendStatus(401);
      }

      const { type, data } = req.body;
      const dataIdForSignature = (req.query["data.id"] as string | undefined) ?? data?.id;
      const signatureValid = isValidMpWebhookSignature({
        xSignature: req.headers["x-signature"] as string | undefined,
        xRequestId: req.headers["x-request-id"] as string | undefined,
        dataId: dataIdForSignature ? String(dataIdForSignature) : undefined,
        secret: webhookSecret,
      });
      if (!signatureValid) {
        console.error("[Webhook] Assinatura x-signature inválida - notificação rejeitada");
        return res.sendStatus(401);
      }

      if (type === "payment" && data?.id) {
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!accessToken) return res.sendStatus(200);

        // Confirmação server-side: nunca confiar no status enviado no corpo do webhook.
        // Timeout explícito: o MP exige HTTP 200/201 em até 22s ou considera a notificação
        // falha e reenvia. Sem limite, esta chamada poderia ficar pendente por bem mais que
        // isso (só limitada pelo timeout de socket do runtime), fazendo o webhook responder
        // tarde ou nunca. WEBHOOK_MP_FETCH_TIMEOUT_MS deixa margem para o restante do handler
        // (consulta ao banco, resposta) dentro da janela de 22s do MP.
        const WEBHOOK_MP_FETCH_TIMEOUT_MS = 15_000;
        let paymentRes: Response;
        try {
          paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
            headers: { "Authorization": `Bearer ${accessToken}` },
            signal: AbortSignal.timeout(WEBHOOK_MP_FETCH_TIMEOUT_MS),
          });
        } catch (fetchError) {
          // Timeout (AbortError) ou falha de rede: não alterar status do pedido. Responder
          // 200 seria interpretado pelo MP como "processado com sucesso" e a notificação não
          // seria reenviada - mas a confirmação real (consulta à API do MP) não aconteceu.
          // Responder com erro permite que o MP reenvie o webhook depois, quando a API
          // estiver disponível novamente.
          console.error(`[Webhook] Timeout/falha de rede ao confirmar pagamento ${data.id} na API do MP:`, fetchError);
          return res.sendStatus(502);
        }
        if (!paymentRes.ok) {
          console.error(`[Webhook] Falha ao confirmar pagamento ${data.id} na API do MP: HTTP ${paymentRes.status}`);
          return res.sendStatus(200);
        }
        const payment = await paymentRes.json() as any;

        if (payment.external_reference) {
          const { getOrderByPaymentId, updateOrderStatus } = await import("../db");
          const order = await getOrderByPaymentId(payment.external_reference);
          if (order) {
            // Idempotência: não regredir um pedido já aprovado por causa de uma
            // notificação atrasada/duplicada (ex.: webhook de "pending" chegando
            // depois de o process-payment já ter confirmado "approved").
            if (order.status === "approved" && payment.status !== "approved") {
              console.warn(`[Webhook] Ignorando notificação ${payment.status} para pedido #${order.id} já aprovado`);
              return res.sendStatus(200);
            }
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

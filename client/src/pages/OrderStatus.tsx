import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { CheckCircle, Clock, XCircle, Truck, MessageCircle, ArrowLeft, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_NUMBER } from "@shared/types";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const statusConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  pending: { icon: Clock, label: "Aguardando Pagamento", color: "text-yellow-600", bg: "bg-yellow-50" },
  approved: { icon: CheckCircle, label: "Pagamento Aprovado", color: "text-green-600", bg: "bg-green-50" },
  shipped: { icon: Truck, label: "Enviado", color: "text-blue-600", bg: "bg-blue-50" },
  delivered: { icon: Package, label: "Entregue", color: "text-green-700", bg: "bg-green-50" },
  rejected: { icon: XCircle, label: "Pagamento Rejeitado", color: "text-red-600", bg: "bg-red-50" },
  cancelled: { icon: XCircle, label: "Cancelado", color: "text-gray-600", bg: "bg-gray-50" },
};

export default function OrderStatus() {
  const [, params] = useRoute("/pedido/:orderId");
  const orderId = params?.orderId ? parseInt(params.orderId) : 0;
  const { data: order, isLoading, refetch } = trpc.orders.byId.useQuery(
    { id: orderId },
    { enabled: orderId > 0, refetchInterval: 10000 }
  );
  const statusScreenRef = useRef<HTMLDivElement>(null);
  const statusScreenInitialized = useRef(false);
  const [mpLoaded, setMpLoaded] = useState(false);

  // Load MP SDK for Status Screen
  useEffect(() => {
    if (document.getElementById("mp-sdk")) { setMpLoaded(true); return; }
    const script = document.createElement("script");
    script.id = "mp-sdk";
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => setMpLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize Status Screen Brick when payment is pending and we have mpPaymentId
  const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || "APP_USR-5454822441939844-022112-a8f48bb38c1a224b86023b93e65f8f38-1457957090";

  useEffect(() => {
    if (!order || statusScreenInitialized.current) return;
    if (order.status !== "pending" || !order.mpPaymentId) return;

    const initStatusScreen = () => {
      if (!window.MercadoPago) {
        setTimeout(initStatusScreen, 1000);
        return;
      }

      statusScreenInitialized.current = true;
      try {
        const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
        const bricksBuilder = mp.bricks();

        bricksBuilder.create("statusScreen", "mp-status-screen", {
          initialization: {
            paymentId: order.mpPaymentId,
          },
          callbacks: {
            onReady: () => { },
            onError: (error: any) => {
              console.error("Status Screen error:", error);
            },
          },
        });
      } catch (err) {
        console.error("[MP] Falha ao criar Status Screen:", err);
        statusScreenInitialized.current = false;
      }
    };

    setTimeout(initStatusScreen, 500);
  }, [order]);

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[oklch(0.65_0.12_350)]" />
        <p className="mt-4 text-muted-foreground">Carregando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-20 text-center">
        <XCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">Pedido não encontrado</h2>
        <Link href="/"><Button className="mt-4">Voltar à Loja</Button></Link>
      </div>
    );
  }

  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  // Build WhatsApp message
  const itemsList = order.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(", ") || "";
  const whatsappMsg = encodeURIComponent(
    `Olá! Acabei de fazer o pedido #${order.id} na CLL JOIAS.\n\n` +
    `Itens: ${itemsList}\n` +
    `Total: R$${parseFloat(order.total).toFixed(2)}\n` +
    `Frete: ${order.shippingMethod || "N/A"}\n\n` +
    `Gostaria de combinar a entrega. Obrigado(a)!`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

  return (
    <div className="min-h-screen">
      <div className="bg-[oklch(0.97_0.015_350)] py-6">
        <div className="container">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Voltar à loja
          </Link>
          <h1 className="text-2xl font-serif font-bold">Pedido #{order.id}</h1>
        </div>
      </div>

      <div className="container py-8 max-w-2xl mx-auto space-y-6">
        {/* Status Badge */}
        <div className={`${config.bg} rounded-xl p-6 text-center`}>
          <StatusIcon className={`w-12 h-12 mx-auto ${config.color} mb-3`} />
          <h2 className={`text-xl font-bold ${config.color}`}>{config.label}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>

        {/* Status Screen do MP (para pagamentos pendentes) */}
        {order.status === "pending" && order.mpPaymentId && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-serif font-bold mb-4">Acompanhar Pagamento</h3>
            <div id="mp-status-screen" ref={statusScreenRef} className="min-h-[200px]">
              {!mpLoaded && <div className="flex items-center justify-center h-32 text-muted-foreground">Carregando...</div>}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-serif font-bold">Detalhes do Pedido</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-medium">{order.customerName}</span>
            </div>
            {order.customerEmail && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{order.customerEmail}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone</span>
                <span>{order.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>{order.shippingMethod} {order.shippingCep && `(CEP: ${order.shippingCep})`}</span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.productName}</span>
                <span className="font-medium">R${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>R${parseFloat(order.shippingPrice || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span>
              <span className="text-[oklch(0.65_0.12_350)]">R${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Button - always visible for local delivery or after payment */}
        <div className="bg-white rounded-xl border p-6 text-center space-y-3">
          <h3 className="font-serif font-bold">Precisa de ajuda?</h3>
          <p className="text-sm text-muted-foreground">
            {order.shippingMethod === "retirada" || order.shippingMethod === "entrega_local"
              ? "Combine a retirada ou entrega pelo WhatsApp:"
              : "Tire dúvidas sobre seu pedido pelo WhatsApp:"}
          </p>
          <a href={whatsappUrl} target="_blank" rel="noopener">
            <Button className="bg-green-500 hover:bg-green-600 text-white gap-2 w-full sm:w-auto">
              <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
            </Button>
          </a>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Continuar Comprando
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

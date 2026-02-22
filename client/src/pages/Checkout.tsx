import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Truck, CreditCard, Shield, CheckCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { FREE_SHIPPING_THRESHOLD, WHATSAPP_NUMBER, validateCPF, validateEmail, validatePhone, formatCPF, formatPhone, formatCEP } from "@shared/types";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();
  const createOrder = trpc.orders.create.useMutation();
  const shippingQuote = trpc.shipping.quote.useMutation();

  const [step, setStep] = useState<"info" | "shipping" | "payment" | "success">("info");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [cep, setCep] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [mpLoaded, setMpLoaded] = useState(false);
  const bricksContainerRef = useRef<HTMLDivElement>(null);
  const bricksInitialized = useRef(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const shippingPrice = selectedShipping?.price || 0;
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const finalShipping = freeShipping && shippingPrice > 0 ? 0 : shippingPrice;
  const total = subtotal + finalShipping;

  // Load MP SDK
  useEffect(() => {
    if (document.getElementById("mp-sdk")) { setMpLoaded(true); return; }
    const script = document.createElement("script");
    script.id = "mp-sdk";
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => setMpLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!customerName.trim() || customerName.trim().split(" ").length < 2) {
      newErrors.name = "Digite seu nome completo";
    }
    if (!customerEmail.trim() || !validateEmail(customerEmail)) {
      newErrors.email = "Email inválido";
    }
    if (!customerPhone.trim() || !validatePhone(customerPhone)) {
      newErrors.phone = "Telefone inválido (DDD + número)";
    }
    if (!customerCpf.trim() || !validateCPF(customerCpf)) {
      newErrors.cpf = "CPF inválido";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Corrija os campos destacados");
      return;
    }
    setStep("shipping");
  };

  const handleShippingQuote = () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length < 8) { toast.error("CEP inválido"); return; }
    const totalWeight = items.reduce((sum, i) => sum + (i.quantity * 200), 0);
    shippingQuote.mutate({ cep: cleanCep, weightGrams: totalWeight });
  };

  const handleShippingSelect = (option: any) => {
    setSelectedShipping(option);
  };

  const handleProceedToPayment = async () => {
    if (!selectedShipping) { toast.error("Selecione uma opção de frete"); return; }
    try {
      const result = await createOrder.mutateAsync({
        customerName,
        customerEmail,
        customerPhone,
        customerCpf,
        shippingMethod: selectedShipping.method,
        shippingPrice: finalShipping.toFixed(2),
        shippingCep: cep.replace(/\D/g, ""),
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        items: items.map(i => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          price: i.price.toFixed(2),
        })),
      });
      setOrderId(result.orderId);
      setPaymentId(result.paymentId);
      setStep("payment");
    } catch (err: any) {
      const msg = err?.message || "Erro ao criar pedido";
      toast.error(msg);
    }
  };

  // Initialize MP Bricks when on payment step
  useEffect(() => {
    if (step !== "payment" || !mpLoaded || !orderId || bricksInitialized.current) return;
    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (!publicKey || !window.MercadoPago) return;
    bricksInitialized.current = true;

    const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
    const bricksBuilder = mp.bricks();

    bricksBuilder.create("payment", "mp-bricks-container", {
      initialization: {
        amount: total,
        payer: {
          email: customerEmail,
          firstName: customerName.split(" ")[0],
          lastName: customerName.split(" ").slice(1).join(" ") || "",
          identification: { type: "CPF", number: customerCpf.replace(/\D/g, "") },
        },
      },
      customization: {
        visual: {
          style: {
            theme: "default",
            customVariables: {
              formBackgroundColor: "#ffffff",
              baseColor: "#c06080",
            },
          },
        },
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          ticket: "all",
          bankTransfer: "all",
          atm: "all",
          maxInstallments: 6,
        },
      },
      callbacks: {
        onReady: () => {},
        onSubmit: async ({ selectedPaymentMethod, formData }: any) => {
          try {
            const response = await fetch("/api/process-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId,
                formData,
                description: `CLL JOIAS - Pedido #${orderId}`,
                external_reference: paymentId,
              }),
            });
            const result = await response.json();
            if (result.status === "approved") {
              clearCart();
              setStep("success");
            } else if (result.status === "pending" || result.status === "in_process") {
              clearCart();
              toast.info("Pagamento pendente. Acompanhe o status.");
              navigate(`/pedido/${orderId}`);
            } else {
              toast.error("Pagamento não aprovado. Tente novamente.");
            }
          } catch (err) {
            clearCart();
            toast.info("Pedido criado! Verifique o status.");
            navigate(`/pedido/${orderId}`);
          }
        },
        onError: (error: any) => {
          console.error("MP Bricks error:", error);
          toast.error("Erro no pagamento. Tente novamente.");
        },
      },
    });
  }, [step, mpLoaded, orderId]);

  if (items.length === 0 && step !== "success") {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">Sacola vazia</h2>
        <Link href="/catalogo"><Button className="mt-4">Ver Catálogo</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[oklch(0.97_0.015_350)] py-6">
        <div className="container">
          <Link href="/carrinho" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Voltar ao carrinho
          </Link>
          <h1 className="text-2xl font-serif font-bold">Checkout</h1>
          {/* Steps */}
          <div className="flex items-center gap-2 mt-4 text-xs">
            {["Dados", "Frete", "Pagamento"].map((s, i) => {
              const stepIndex = ["info", "shipping", "payment"].indexOf(step);
              return (
                <div key={s} className={`flex items-center gap-1 ${i <= stepIndex ? "text-[oklch(0.65_0.12_350)] font-medium" : "text-muted-foreground"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${i <= stepIndex ? "bg-[oklch(0.65_0.12_350)] text-white" : "bg-muted"}`}>
                    {i + 1}
                  </span>
                  {s}
                  {i < 2 && <span className="mx-1 text-muted-foreground">&rarr;</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Step 1: Customer Info */}
            {step === "info" && (
              <form onSubmit={handleInfoSubmit} className="bg-white rounded-xl border p-6 space-y-4">
                <h3 className="font-serif font-bold text-lg">Seus Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nome Completo *</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.12_350)]/30 ${errors.name ? "border-red-500" : ""}`} />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email *</label>
                    <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.12_350)]/30 ${errors.email ? "border-red-500" : ""}`} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Telefone *</label>
                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(formatPhone(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.12_350)]/30 ${errors.phone ? "border-red-500" : ""}`}
                      placeholder="(71) 99999-9999" />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">CPF *</label>
                    <input type="text" value={customerCpf} onChange={e => setCustomerCpf(formatCPF(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.12_350)]/30 ${errors.cpf ? "border-red-500" : ""}`}
                      placeholder="000.000.000-00" />
                    {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
                  </div>
                </div>
                <Button type="submit" className="bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white gap-2">
                  Continuar <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
              </form>
            )}

            {/* Step 2: Shipping */}
            {step === "shipping" && (
              <div className="bg-white rounded-xl border p-6 space-y-4">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[oklch(0.65_0.12_350)]" /> Frete e Entrega
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cep}
                    onChange={e => setCep(formatCEP(e.target.value))}
                    placeholder="Digite seu CEP"
                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.12_350)]/30"
                  />
                  <Button variant="outline" onClick={handleShippingQuote} disabled={shippingQuote.isPending}>
                    {shippingQuote.isPending ? "Calculando..." : "Calcular"}
                  </Button>
                </div>
                {shippingQuote.data && !shippingQuote.data.error && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{shippingQuote.data.city}, {shippingQuote.data.state}</p>
                    {freeShipping && !shippingQuote.data.isLocal && <p className="text-sm text-green-600 font-medium">Frete grátis para compras acima de R${FREE_SHIPPING_THRESHOLD.toFixed(2)}!</p>}
                    {shippingQuote.data.options?.map((opt: any) => (
                      <button
                        key={opt.method}
                        onClick={() => handleShippingSelect(opt)}
                        className={`w-full flex justify-between items-center text-sm p-3 rounded-lg border transition-colors ${selectedShipping?.method === opt.method ? "border-[oklch(0.65_0.12_350)] bg-[oklch(0.96_0.015_350)]" : "border-border hover:bg-muted/30"}`}
                      >
                        <div className="text-left">
                          <span className="font-medium">{opt.label}</span>
                          {opt.description && <p className="text-xs text-muted-foreground">{opt.description}</p>}
                        </div>
                        <span className="font-semibold">
                          {opt.price === 0 ? (
                            <span className="text-amber-600">A combinar</span>
                          ) : freeShipping ? (
                            <span className="text-green-600">Grátis</span>
                          ) : (
                            `R$${opt.price.toFixed(2)}`
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {shippingQuote.data?.error && <p className="text-sm text-destructive">{shippingQuote.data.error}</p>}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("info")}>Voltar</Button>
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={!selectedShipping || createOrder.isPending}
                    className="bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white gap-2"
                  >
                    {createOrder.isPending ? "Criando pedido..." : "Ir para Pagamento"}
                    <CreditCard className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === "payment" && (
              <div className="bg-white rounded-xl border p-6 space-y-4">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[oklch(0.65_0.12_350)]" /> Pagamento
                </h3>
                <p className="text-sm text-muted-foreground">Pedido #{orderId} - Pague com Pix ou Cartão de Crédito</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <Shield className="w-4 h-4" /> Pagamento processado com segurança pelo Mercado Pago
                </div>
                <div id="mp-bricks-container" ref={bricksContainerRef} className="min-h-[300px]">
                  {!mpLoaded && <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando pagamento...</div>}
                </div>
              </div>
            )}

            {/* Step 4: Success - Redirect to WhatsApp */}
            {step === "success" && (
              <div className="bg-white rounded-xl border p-8 text-center space-y-6">
                <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-green-700">Pagamento Aprovado!</h2>
                  <p className="text-muted-foreground mt-2">Seu pedido #{orderId} foi confirmado com sucesso.</p>
                </div>
                <div className="bg-[oklch(0.97_0.015_350)] rounded-xl p-6 space-y-3">
                  <MessageCircle className="w-8 h-8 text-green-500 mx-auto" />
                  <h3 className="font-serif font-bold text-lg">Agora vamos combinar a entrega!</h3>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão abaixo para ir ao nosso WhatsApp e combinar a entrega ou retirada do seu pedido.
                  </p>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Olá! Meu pagamento do pedido #${orderId} foi aprovado! \n\nNome: ${customerName}\nTotal: R$${total.toFixed(2)}\n\nGostaria de combinar a entrega/retirada. Obrigado(a)!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-green-500 hover:bg-green-600 text-white gap-2 w-full text-base py-6">
                      <MessageCircle className="w-5 h-5" /> Ir para o WhatsApp da Loja
                    </Button>
                  </a>
                </div>
                <div className="flex gap-3 justify-center">
                  <Link href={`/pedido/${orderId}`}>
                    <Button variant="outline" className="gap-2">
                      Ver Detalhes do Pedido
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Continuar Comprando
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border p-6 sticky top-24 space-y-4">
              <h3 className="font-serif font-bold">Resumo do Pedido</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.productId} className="flex gap-3 text-sm">
                    {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-muted-foreground">{item.quantity}x R${item.price.toFixed(2)}</p>
                    </div>
                    <span className="font-medium">R${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span>
                    {selectedShipping
                      ? finalShipping === 0
                        ? selectedShipping.price === 0
                          ? <span className="text-amber-600">A combinar</span>
                          : <span className="text-green-600">Grátis</span>
                        : `R$${finalShipping.toFixed(2)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total</span>
                  <span>R${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

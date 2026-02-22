import { Link, useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { FREE_SHIPPING_THRESHOLD } from "@shared/types";

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();
  const freeShippingDiff = FREE_SHIPPING_THRESHOLD - subtotal;

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">Sua sacola está vazia</h2>
        <p className="text-muted-foreground text-sm mb-6">Adicione peças incríveis ao seu carrinho!</p>
        <Link href="/catalogo">
          <Button className="bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white gap-2">
            Ver Catálogo <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[oklch(0.97_0.015_350)] py-8">
        <div className="container">
          <h1 className="text-2xl font-serif font-bold">Sacola de Compras</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.productId} className="flex gap-4 p-4 bg-white rounded-xl border border-border/50">
                {item.image && (
                  <Link href={`/produto/${item.slug}`}>
                    <img src={item.image} alt={item.name} className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover" />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/produto/${item.slug}`} className="font-medium text-sm hover:text-[oklch(0.65_0.12_350)] transition-colors">
                    {item.name}
                  </Link>
                  <div className="mt-1">
                    {item.discountPercent && item.discountPercent > 0 && item.originalPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs line-through text-muted-foreground">R${item.originalPrice.toFixed(2)}</span>
                        <span className="text-sm font-bold text-[oklch(0.65_0.12_350)]">R${item.price.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold">R${item.price.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 border rounded-lg">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 hover:bg-muted rounded-l-lg">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1.5 hover:bg-muted rounded-r-lg">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="ml-auto text-sm font-semibold">R${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-border/50 p-6 sticky top-24 space-y-4">
              <h3 className="font-serif font-bold text-lg">Resumo</h3>
              {freeShippingDiff > 0 ? (
                <div className="bg-[oklch(0.96_0.015_350)] rounded-lg p-3 text-sm text-center">
                  Falta <strong>R${freeShippingDiff.toFixed(2)}</strong> para frete grátis!
                </div>
              ) : (
                <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm text-center font-medium">
                  Você ganhou frete grátis!
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">R${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Frete</span>
                  <span>Calculado no checkout</span>
                </div>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>R${subtotal.toFixed(2)}</span>
              </div>
              <Button
                className="w-full bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white gap-2"
                onClick={() => navigate("/checkout")}
              >
                Ir para Pagamento <ArrowRight className="w-4 h-4" />
              </Button>
              <Link href="/catalogo">
                <Button variant="ghost" className="w-full text-sm gap-1">
                  <ArrowLeft className="w-3 h-3" /> Continuar Comprando
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

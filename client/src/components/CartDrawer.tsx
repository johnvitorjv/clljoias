import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { FREE_SHIPPING_THRESHOLD } from "@shared/types";

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, isOpen, setIsOpen, itemCount } = useCart();
  const [, navigate] = useLocation();
  const freeShippingDiff = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif text-lg">Sacola ({itemCount})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 opacity-30" />
            <p className="text-sm">Sua sacola está vazia</p>
            <Button variant="outline" onClick={() => { setIsOpen(false); navigate("/catalogo"); }}>
              Ver Catálogo
            </Button>
          </div>
        ) : (
          <>
            {freeShippingDiff > 0 && (
              <div className="bg-[oklch(0.96_0.015_350)] rounded-lg p-3 text-sm text-center">
                Falta <strong>R${freeShippingDiff.toFixed(2)}</strong> para frete grátis!
              </div>
            )}
            {freeShippingDiff <= 0 && (
              <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm text-center font-medium">
                Parabéns! Você ganhou frete grátis!
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 py-2">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.discountPercent && item.discountPercent > 0 && item.originalPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs line-through text-muted-foreground">R${item.originalPrice.toFixed(2)}</span>
                          <span className="text-sm font-semibold text-[oklch(0.65_0.12_350)]">R${item.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold">R${item.price.toFixed(2)}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeItem(item.productId)} className="ml-auto p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">R${subtotal.toFixed(2)}</span>
              </div>
              <Button
                className="w-full bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white"
                onClick={() => { setIsOpen(false); navigate("/carrinho"); }}
              >
                Ver Carrinho
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setIsOpen(false); navigate("/checkout"); }}
              >
                Ir para Pagamento
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

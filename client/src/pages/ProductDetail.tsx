import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { ArrowLeft, ShoppingBag, MessageCircle, Minus, Plus, Truck, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { WHATSAPP_NUMBER, FREE_SHIPPING_THRESHOLD } from "@shared/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:slug");
  const slug = params?.slug || "";
  const { data: product, isLoading } = trpc.products.bySlug.useQuery({ slug }, { enabled: !!slug });
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [cep, setCep] = useState("");
  const shippingQuote = trpc.shipping.quote.useMutation();

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square bg-muted rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-xl font-serif">Produto não encontrado</h2>
        <Link href="/catalogo"><Button variant="outline" className="mt-4">Ver Catálogo</Button></Link>
      </div>
    );
  }

  const images = (product.images as string[] | null) || [];
  const price = parseFloat(product.price);
  const originalPrice = product.originalPrice ? parseFloat(product.originalPrice) : null;
  const discount = product.discountPercent || 0;
  const freeShippingDiff = FREE_SHIPPING_THRESHOLD - price * quantity;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price,
      originalPrice: originalPrice || undefined,
      discountPercent: discount,
      image: images[0],
      quantity,
    });
    toast.success("Adicionado à sacola!", { description: `${quantity}x ${product.name}` });
  };

  const whatsappMsg = encodeURIComponent(`Olá! Tenho interesse na peça:\n${product.name}\nR$${price.toFixed(2)}\n${window.location.href}`);

  const handleShippingQuote = () => {
    if (cep.replace(/\D/g, "").length < 8) { toast.error("CEP inválido"); return; }
    shippingQuote.mutate({ cep, weightGrams: product.weightGrams || 200 });
  };

  return (
    <div className="min-h-screen">
      <div className="container py-4">
        <Link href="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </div>

      <div className="container pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/30">
              {images.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      src={images[selectedImage]}
                      alt={product.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setSelectedImage(i => i > 0 ? i - 1 : images.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setSelectedImage(i => i < images.length - 1 ? i + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <ShoppingBag className="w-16 h-16" />
                </div>
              )}
              {discount > 0 && (
                <span className="absolute top-3 left-3 bg-[oklch(0.65_0.12_350)] text-white text-sm font-bold px-3 py-1 rounded">
                  -{discount}%
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${i === selectedImage ? "border-[oklch(0.65_0.12_350)]" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <p className="text-xs text-muted-foreground tracking-wider uppercase mb-1">{product.categoryLine} · {product.material}</p>
              <h1 className="text-2xl md:text-3xl font-serif font-bold">{product.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{product.accessoryType}</p>
            </div>

            <div className="flex items-baseline gap-3">
              {originalPrice && discount > 0 ? (
                <>
                  <span className="text-lg line-through text-muted-foreground">R${originalPrice.toFixed(2)}</span>
                  <span className="text-3xl font-bold text-[oklch(0.65_0.12_350)]">R${price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-3xl font-bold">R${price.toFixed(2)}</span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              ou até <strong>3x de R${(price / 3).toFixed(2)}</strong> sem juros
            </p>

            {product.description && (
              <div className="text-sm text-muted-foreground leading-relaxed border-t pt-4">
                {product.description}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantidade:</span>
              <div className="flex items-center gap-2 border rounded-lg">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 hover:bg-muted rounded-l-lg">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="p-2 hover:bg-muted rounded-r-lg">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleAddToCart} size="lg" className="flex-1 bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white gap-2">
                <ShoppingBag className="w-4 h-4" /> Adicionar à Sacola
              </Button>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`} target="_blank" rel="noopener" className="flex-1">
                <Button variant="outline" size="lg" className="w-full gap-2 border-green-500 text-green-600 hover:bg-green-50">
                  <MessageCircle className="w-4 h-4" /> Comprar via WhatsApp
                </Button>
              </a>
            </div>

            {freeShippingDiff > 0 && (
              <p className="text-xs text-muted-foreground">
                Falta R${freeShippingDiff.toFixed(2)} para frete grátis!
              </p>
            )}

            {/* Shipping */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Truck className="w-4 h-4 text-[oklch(0.65_0.12_350)]" /> Calcular Frete
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cep}
                  onChange={e => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="00000-000"
                  className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.12_350)]/30"
                  maxLength={9}
                />
                <Button variant="outline" size="sm" onClick={handleShippingQuote} disabled={shippingQuote.isPending}>
                  {shippingQuote.isPending ? "..." : "Calcular"}
                </Button>
              </div>
              {shippingQuote.data && !shippingQuote.data.error && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{shippingQuote.data.city}, {shippingQuote.data.state}</p>
                  {shippingQuote.data.options?.map((opt: any) => (
                    <div key={opt.method} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        {opt.description && <span className="text-xs text-muted-foreground ml-2">{opt.description}</span>}
                      </div>
                      <span className="font-semibold">{opt.price === 0 ? "Grátis" : `R$${opt.price.toFixed(2)}`}</span>
                    </div>
                  ))}
                </div>
              )}
              {shippingQuote.data?.error && (
                <p className="text-xs text-destructive">{shippingQuote.data.error}</p>
              )}
            </div>

            {/* Trust */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" /> Compra 100% segura via Mercado Pago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

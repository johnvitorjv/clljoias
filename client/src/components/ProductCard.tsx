import { useLocation } from "wouter";
import { ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { WHATSAPP_NUMBER } from "@shared/types";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Product } from "@shared/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [, navigate] = useLocation();
  const images = (product.images as string[] | null) || [];
  const mainImage = images[0];
  const secondImage = images[1];
  const price = parseFloat(product.price);
  const originalPrice = product.originalPrice ? parseFloat(product.originalPrice) : null;
  const discount = product.discountPercent || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price,
      originalPrice: originalPrice || undefined,
      discountPercent: discount,
      image: mainImage,
      quantity: 1,
    });
    toast.success("Adicionado à sacola!", {
      description: product.name,
      duration: 2000,
    });
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const whatsappMsg = encodeURIComponent(`Olá! Tenho interesse na peça: ${product.name} - R$${price.toFixed(2)}\n${typeof window !== 'undefined' ? window.location.origin : ''}/produto/${product.slug}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="group block cursor-pointer"
        onClick={() => navigate(`/produto/${product.slug}`)}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/produto/${product.slug}`); }}
      >
        <div className="relative overflow-hidden rounded-lg bg-muted/30 aspect-square">
          {mainImage ? (
            <>
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              />
              {secondImage && (
                <img
                  src={secondImage}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <ShoppingBag className="w-12 h-12" />
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-[oklch(0.65_0.12_350)] text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}

          {/* Hover actions */}
          <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-white/95 backdrop-blur-sm text-foreground text-xs font-medium py-2.5 rounded-md hover:bg-white transition-colors flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Adicionar
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener"
              onClick={handleWhatsApp}
              className="bg-green-500 text-white p-2.5 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile actions always visible */}
          <div className="absolute bottom-2 right-2 flex gap-1.5 lg:hidden">
            <button
              onClick={handleAddToCart}
              className="bg-white/90 p-2 rounded-full shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-sm font-medium truncate group-hover:text-[oklch(0.65_0.12_350)] transition-colors">
            {product.name}
          </p>
          <p className="text-xs text-muted-foreground">{product.material} · {product.accessoryType}</p>
          <div className="flex items-center gap-2">
            {originalPrice && discount > 0 ? (
              <>
                <span className="text-xs line-through text-muted-foreground">R${originalPrice.toFixed(2)}</span>
                <span className="text-sm font-bold text-[oklch(0.65_0.12_350)]">R${price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-sm font-bold">R${price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

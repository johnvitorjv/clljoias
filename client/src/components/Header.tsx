import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, Menu, X, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { CATEGORY_LINES } from "@shared/types";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663370743129/SRLuMBLhpOzKodgg.png";

const categorySlugMap: Record<string, string> = {
  "Pratas 925": "pratas-925",
  "Relógios": "relogios",
  "Semi-joias": "semi-joias",
  "Tornozeleiras": "tornozeleiras",
  "Personalizados": "personalizados",
  "Personalizados Pet": "personalizados-pet",
};

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, setIsOpen } = useCart();
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Top bar */}
      <div className="bg-[oklch(0.65_0.12_350)] text-white text-xs py-1.5 text-center tracking-widest uppercase font-light">
        Frete grátis acima de R$199,90 | Enviamos para toda a Bahia
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container flex items-center justify-between h-16 lg:h-20 relative">
          {/* Mobile menu */}
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2">
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <img src={LOGO_URL} alt="CLL JOIAS" className="h-10 lg:h-14 w-auto rounded-full object-cover" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm tracking-wide">
            <Link href="/catalogo" className="hover:text-[oklch(0.65_0.12_350)] transition-colors font-medium">
              Catálogo
            </Link>
            {CATEGORY_LINES.map(cat => (
              <Link
                key={cat}
                href={`/categoria/${categorySlugMap[cat]}`}
                className="hover:text-[oklch(0.65_0.12_350)] transition-colors whitespace-nowrap"
              >
                {cat}
              </Link>
            ))}
            <Link href="/materiais" className="hover:text-[oklch(0.65_0.12_350)] transition-colors">
              Materiais
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:text-[oklch(0.65_0.12_350)] transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => setIsOpen(true)} className="p-2 hover:text-[oklch(0.65_0.12_350)] transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-[oklch(0.65_0.12_350)] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center"
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/50 overflow-hidden"
            >
              <form onSubmit={handleSearch} className="container py-3">
                <div className="relative max-w-xl mx-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome, tipo, material..."
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.12_350)]/30"
                    autoFocus
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto"
            >
              <div className="p-4 flex items-center justify-between border-b">
                <img src={LOGO_URL} alt="CLL JOIAS" className="h-10 rounded-full object-cover" />
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                <Link href="/catalogo" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 rounded-lg hover:bg-muted font-medium">
                  Catálogo Completo
                </Link>
                {CATEGORY_LINES.map(cat => (
                  <Link
                    key={cat}
                    href={`/categoria/${categorySlugMap[cat]}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-3 rounded-lg hover:bg-muted text-sm"
                  >
                    {cat}
                  </Link>
                ))}
                <div className="border-t my-3" />
                <Link href="/materiais" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-3 rounded-lg hover:bg-muted text-sm">
                  Nossos Materiais
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

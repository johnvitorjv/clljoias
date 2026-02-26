import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowRight, Gem, Shield, Truck, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { WHATSAPP_URL, CATEGORY_LINES } from "@shared/types";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663370743129/SRLuMBLhpOzKodgg.png";

const categorySlugMap: Record<string, string> = {
  "Pratas 925": "pratas-925",
  "Relógios": "relogios",
  "Semi-joias": "semi-joias",
  "Tornozeleiras": "tornozeleiras",
  "Personalizados": "personalizados",
  "Personalizados Pet": "personalizados-pet",
};

const categoryDescriptions: Record<string, string> = {
  "Pratas 925": "Peças em prata legítima com garantia",
  "Relógios": "Relógios elegantes para todas as ocasiões",
  "Semi-joias": "Banhadas a ouro e prata com acabamento premium",
  "Tornozeleiras": "Delicadeza e charme para seus tornozelos",
  "Personalizados": "Peças únicas feitas para você",
  "Personalizados Pet": "Homenageie seu pet com joias exclusivas",
};

export default function Home() {
  const { data: featured, isLoading } = trpc.products.featured.useQuery();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.97_0.02_350)] via-white to-[oklch(0.96_0.03_80)]">
        <div className="container py-16 lg:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block text-xs tracking-[0.3em] uppercase text-[oklch(0.65_0.12_350)] font-medium mb-4">@cll.joias</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">
                Elegância que <span className="text-[oklch(0.65_0.12_350)]">traduz</span> quem você é
              </h1>
              <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Semi joias banhadas em Ouro e Prata, Pratas 925 com garantia e acessórios personalizados. Enviamos para toda a Bahia.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/catalogo">
                  <Button size="lg" className="bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white px-8 gap-2">
                    Ver Catálogo <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener">
                  <Button size="lg" variant="outline" className="gap-2 border-[oklch(0.65_0.12_350)] text-[oklch(0.65_0.12_350)]">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-[oklch(0.72_0.11_350)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-[oklch(0.78_0.08_80)]/10 rounded-full blur-3xl" />
      </section>

      {/* Trust badges */}
      <section className="border-y border-border/50 bg-white">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: Gem, label: "Pratas 925 Legítimas", sub: "Com garantia" },
              { icon: Shield, label: "Compra Segura", sub: "Mercado Pago" },
              { icon: Truck, label: "Envio para Bahia", sub: "Entrega rápida" },
              { icon: Star, label: "2.000+ Clientes", sub: "Satisfeitos" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <Icon className="w-5 h-5 text-[oklch(0.65_0.12_350)]" />
                <span className="text-xs font-medium">{label}</span>
                <span className="text-[10px] text-muted-foreground">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-14 lg:py-20">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif font-bold">Destaques</h2>
            <p className="mt-2 text-muted-foreground text-sm">Peças selecionadas especialmente para você</p>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Em breve novos produtos!</p>
            </div>
          )}
          <div className="text-center mt-10">
            <Link href="/catalogo">
              <Button variant="outline" size="lg" className="gap-2">
                Ver todos os produtos <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 lg:py-20 bg-[oklch(0.97_0.015_350)]">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif font-bold">Nossas Categorias</h2>
            <p className="mt-2 text-muted-foreground text-sm">Encontre a peça perfeita para cada momento</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORY_LINES.map((cat, i) => (
              <motion.div key={cat} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link href={`/categoria/${categorySlugMap[cat]}`} className="group block p-6 bg-white rounded-xl border border-border/50 hover:border-[oklch(0.65_0.12_350)]/30 hover:shadow-md transition-all text-center">
                  <Gem className="w-6 h-6 mx-auto text-[oklch(0.65_0.12_350)] mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-serif font-semibold text-sm">{cat}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{categoryDescriptions[cat]}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-14 lg:py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <img src={LOGO_URL} alt="CLL JOIAS" className="h-20 mx-auto mb-6 opacity-80" />
              <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Sobre a CLL JOIAS</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Somos uma loja de semi joias e acessórios localizada em Salvador, Bahia. Trabalhamos com peças banhadas em ouro e prata, pratas 925 com garantia, e acessórios personalizados.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Cada peça é selecionada com carinho para garantir qualidade e elegância. Enviamos para toda a Bahia com segurança e rapidez.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="https://instagram.com/cll.joias" target="_blank" rel="noopener">
                  <Button variant="outline" className="gap-2">Siga no Instagram</Button>
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener">
                  <Button className="bg-green-500 hover:bg-green-600 text-white gap-2">
                    <MessageCircle className="w-4 h-4" /> Fale Conosco
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

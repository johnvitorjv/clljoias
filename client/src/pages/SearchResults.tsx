import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useSearch, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import ProductCard from "@/components/ProductCard";

export default function SearchResults() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const query = params.get("q") || "";

  const { data: products, isLoading } = trpc.products.search.useQuery(
    { query },
    { enabled: query.length > 0 }
  );

  return (
    <div className="min-h-screen">
      <div className="bg-[oklch(0.97_0.015_350)] py-8">
        <div className="container">
          <Link href="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> Voltar ao catálogo
          </Link>
          <h1 className="text-2xl font-serif font-bold">
            Resultados para "{query}"
          </h1>
          {products && <p className="text-sm text-muted-foreground mt-1">{products.length} produto(s) encontrado(s)</p>}
        </div>
      </div>
      <div className="container py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-square bg-muted rounded-lg" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-serif">Nenhum resultado encontrado</p>
            <p className="text-sm mt-2">Tente buscar por outro termo</p>
          </div>
        )}
      </div>
    </div>
  );
}

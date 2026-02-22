import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import { CATEGORY_LINES, MATERIALS, ACCESSORY_TYPES } from "@shared/types";

export default function Catalog() {
  const { data: products, isLoading } = trpc.products.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.accessoryType.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (categoryFilter !== "all") result = result.filter(p => p.categoryLine === categoryFilter);
    if (materialFilter !== "all") result = result.filter(p => p.material === materialFilter);
    if (typeFilter !== "all") result = result.filter(p => p.accessoryType === typeFilter);
    switch (sortBy) {
      case "price_asc": result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); break;
      case "price_desc": result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); break;
      case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "featured": default: result.sort((a, b) => (b.featured || 0) - (a.featured || 0)); break;
    }
    return result;
  }, [products, searchQuery, categoryFilter, materialFilter, typeFilter, sortBy]);

  const hasFilters = categoryFilter !== "all" || materialFilter !== "all" || typeFilter !== "all" || searchQuery.trim();

  return (
    <div className="min-h-screen">
      <div className="bg-[oklch(0.97_0.015_350)] py-8 lg:py-12">
        <div className="container">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-center">Catálogo</h1>
          <p className="text-center text-muted-foreground text-sm mt-2">Explore nossa coleção completa</p>
        </div>
      </div>

      <div className="container py-6">
        {/* Search and filter bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, tipo, material..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.12_350)]/30"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filtros
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 text-sm">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Destaques</SelectItem>
                <SelectItem value="price_asc">Menor Preço</SelectItem>
                <SelectItem value="price_desc">Maior Preço</SelectItem>
                <SelectItem value="newest">Mais Recentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-muted/30 rounded-lg">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 text-sm">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {CATEGORY_LINES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="w-40 text-sm">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Materiais</SelectItem>
                {MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {ACCESSORY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => { setCategoryFilter("all"); setMaterialFilter("all"); setTypeFilter("all"); setSearchQuery(""); }} className="gap-1 text-xs">
                <X className="w-3 h-3" /> Limpar
              </Button>
            )}
          </div>
        )}

        {/* Results */}
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? "produto" : "produtos"} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-square bg-muted rounded-lg" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-serif">Nenhum produto encontrado</p>
            <p className="text-sm mt-2">Tente ajustar os filtros ou buscar por outro termo</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, ShoppingCart, BarChart3, Plus, Pencil, Trash2, ImagePlus, Wand2, Eye, EyeOff, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_LINES, MATERIALS, ACCESSORY_TYPES } from "@shared/types";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [adminAuth, setAdminAuth] = useState(false);
  const [password, setPassword] = useState("");
  const adminLogin = trpc.admin.login.useMutation();

  const isAdmin = user?.role === "admin";

  if (authLoading) return <div className="container py-20 text-center text-muted-foreground">Carregando...</div>;

  if (!isAdmin && !adminAuth) {
    return (
      <div className="container py-20 max-w-sm mx-auto text-center">
        <h2 className="text-xl font-serif font-bold mb-4">Painel Administrativo</h2>
        <p className="text-sm text-muted-foreground mb-6">Digite a senha de administrador</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const result = await adminLogin.mutateAsync({ password });
          if (result.success) {
            // Save token to localStorage for Safari iOS (cookies blocked by ITP)
            if ((result as any).token) {
              localStorage.setItem("admin_token", (result as any).token);
            }
            setAdminAuth(true); toast.success("Acesso autorizado");
          }
          else toast.error(result.error || "Senha incorreta");
        }} className="space-y-3">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="w-full px-3 py-2 border rounded-md text-sm" />
          <Button type="submit" className="w-full bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white" disabled={adminLogin.isPending}>
            {adminLogin.isPending ? "Verificando..." : "Entrar"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-white border-b py-4">
        <div className="container flex items-center justify-between">
          <h1 className="text-xl font-serif font-bold">Painel Admin</h1>
          <span className="text-xs text-muted-foreground">CLL JOIAS</span>
        </div>
      </div>
      <div className="container py-6">
        <Tabs defaultValue="stats">
          <TabsList className="mb-6">
            <TabsTrigger value="stats" className="gap-1"><BarChart3 className="w-3.5 h-3.5" /> Dashboard</TabsTrigger>
            <TabsTrigger value="products" className="gap-1"><Package className="w-3.5 h-3.5" /> Produtos</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1"><ShoppingCart className="w-3.5 h-3.5" /> Pedidos</TabsTrigger>
            <TabsTrigger value="ai" className="gap-1"><Wand2 className="w-3.5 h-3.5" /> IA</TabsTrigger>
          </TabsList>

          <TabsContent value="stats"><StatsTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="ai"><AITab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatsTab() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();
  if (isLoading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "Total Produtos", value: stats.totalProducts, sub: `${stats.activeProducts} ativos` },
        { label: "Total Pedidos", value: stats.totalOrders, sub: `${stats.pendingOrders} pendentes` },
        { label: "Receita Total", value: `R$${stats.totalRevenue.toFixed(2)}`, sub: `${stats.approvedOrders} aprovados` },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-xl border p-5">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="text-2xl font-bold mt-1">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

function ProductsTab() {
  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.products.listAll.useQuery();
  const createProduct = trpc.products.create.useMutation({ onSuccess: () => { utils.products.listAll.invalidate(); toast.success("Produto criado!"); } });
  const updateProduct = trpc.products.update.useMutation({ onSuccess: () => { utils.products.listAll.invalidate(); toast.success("Produto atualizado!"); } });
  const deleteProduct = trpc.products.delete.useMutation({ onSuccess: () => { utils.products.listAll.invalidate(); toast.success("Produto removido!"); } });
  const uploadImage = trpc.products.uploadImage.useMutation();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Scroll to form when editing a product
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm, editingProduct]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-serif font-bold">Produtos ({products?.length || 0})</h3>
        <Button size="sm" onClick={() => { setEditingProduct(null); setShowForm(true); }} className="gap-1 bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white">
          <Plus className="w-3.5 h-3.5" /> Novo Produto
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-2">
          {products?.map(p => {
            const images = (p.images as string[] | null) || [];
            return (
              <div key={p.id} className="bg-white rounded-lg border p-3 flex items-center gap-3">
                {images[0] ? (
                  <img src={images[0]} alt="" className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.categoryLine} · {p.material} · R${parseFloat(p.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {p.featured === 1 && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                  {p.active === 1 ? <Eye className="w-3.5 h-3.5 text-green-500" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                  <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(p); setShowForm(true); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Remover produto?")) deleteProduct.mutate({ id: p.id }); }}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulário de edição/criação aparece ABAIXO da lista, na posição visível */}
      {showForm && (
        <div ref={formRef}>
          <ProductForm
            product={editingProduct}
            onSave={async (data: any) => {
              if (editingProduct) {
                await updateProduct.mutateAsync({ id: editingProduct.id, ...data });
              } else {
                await createProduct.mutateAsync(data);
              }
              setShowForm(false);
              setEditingProduct(null);
            }}
            onCancel={() => { setShowForm(false); setEditingProduct(null); }}
            uploadImage={uploadImage}
          />
        </div>
      )}
    </div>
  );
}

function ProductForm({ product, onSave, onCancel, uploadImage }: any) {
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || "");
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice || "");
  const [discountPercent, setDiscountPercent] = useState(product?.discountPercent || 0);
  const [categoryLine, setCategoryLine] = useState(product?.categoryLine || CATEGORY_LINES[0]);
  const [material, setMaterial] = useState(product?.material || MATERIALS[0]);
  const [accessoryType, setAccessoryType] = useState(product?.accessoryType || ACCESSORY_TYPES[0]);
  const [images, setImages] = useState<string[]>((product?.images as string[]) || []);
  const [featured, setFeatured] = useState(product?.featured || 0);
  const [active, setActive] = useState(product?.active ?? 1);
  const [stock, setStock] = useState(product?.stock || 0);
  const [weightGrams, setWeightGrams] = useState(product?.weightGrams || 200);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const generateSlug = (n: string) => n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          const result = await uploadImage.mutateAsync({ base64, filename: file.name, contentType: file.type });
          setImages(prev => [...prev, result.url]);
          toast.success("Imagem enviada!");
        } catch { toast.error("Erro ao enviar imagem"); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) { toast.error("Nome e preço são obrigatórios"); return; }
    setSaving(true);
    try {
      await onSave({
        name, slug: slug || generateSlug(name), description, price, originalPrice: originalPrice || undefined,
        discountPercent, categoryLine, material, accessoryType, images, featured, active,
        stock, weightGrams, displayOrder: 0,
      });
    } catch { toast.error("Erro ao salvar"); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
      <h3 className="font-serif font-bold">{product ? "Editar Produto" : "Novo Produto"}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium mb-1 block">Nome *</label>
          <input value={name} onChange={e => { setName(e.target.value); if (!product) setSlug(generateSlug(e.target.value)); }} className="w-full px-3 py-2 border rounded-md text-sm" required />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Preço *</label>
          <input value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="99.90" required />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Preço Original</label>
          <input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="129.90" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Desconto %</label>
          <input type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Categoria</label>
          <Select value={categoryLine} onValueChange={setCategoryLine}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORY_LINES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Material</label>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Tipo</label>
          <Select value={accessoryType} onValueChange={setAccessoryType}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{ACCESSORY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Estoque</label>
          <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Peso (gramas)</label>
          <input type="number" value={weightGrams} onChange={e => setWeightGrams(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Descrição</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Imagens</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative w-16 h-16">
              <img src={img} alt="" className="w-full h-full rounded object-cover" />
              <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
            </div>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1" disabled={uploadImage.isPending}>
          <ImagePlus className="w-3.5 h-3.5" /> {uploadImage.isPending ? "Enviando..." : "Adicionar Imagem"}
        </Button>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured === 1} onChange={e => setFeatured(e.target.checked ? 1 : 0)} /> Destaque
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active === 1} onChange={e => setActive(e.target.checked ? 1 : 0)} /> Ativo
        </label>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving} className="bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function OrdersTab() {
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.orders.listAll.useQuery();
  const updateStatus = trpc.orders.updateStatus.useMutation({ onSuccess: () => { utils.orders.listAll.invalidate(); toast.success("Status atualizado!"); } });

  const statusOptions = ["pending", "approved", "shipped", "delivered", "rejected", "cancelled"];
  const statusLabels: Record<string, string> = { pending: "Pendente", approved: "Aprovado", shipped: "Enviado", delivered: "Entregue", rejected: "Rejeitado", cancelled: "Cancelado" };

  if (isLoading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="font-serif font-bold">Pedidos ({orders?.length || 0})</h3>
      {orders?.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum pedido ainda</p>
      ) : (
        <div className="space-y-3">
          {orders?.map(order => (
            <div key={order.id} className="bg-white rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold">#{order.id}</span>
                  <span className="text-xs text-muted-foreground ml-2">{new Date(order.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <Select value={order.status} onValueChange={v => updateStatus.mutate({ id: order.id, status: v })}>
                  <SelectTrigger className="w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Cliente:</strong> {order.customerName}</p>
                {order.customerEmail && <p><strong>Email:</strong> {order.customerEmail}</p>}
                {order.customerPhone && <p><strong>Telefone:</strong> {order.customerPhone}</p>}
                <p><strong>Frete:</strong> {order.shippingMethod} - R${parseFloat(order.shippingPrice || "0").toFixed(2)} (CEP: {order.shippingCep})</p>
                <p><strong>Total:</strong> <span className="font-bold text-[oklch(0.65_0.12_350)]">R${parseFloat(order.total).toFixed(2)}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AITab() {
  const [prompt, setPrompt] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const generateImage = trpc.products.generateImage.useMutation();

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Digite uma descrição"); return; }
    try {
      const result = await generateImage.mutateAsync({ prompt });
      setGeneratedUrl(result.url || "");
      toast.success("Imagem gerada com sucesso!");
    } catch { toast.error("Erro ao gerar imagem"); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="font-serif font-bold mb-2">Gerar Imagem com IA</h3>
        <p className="text-sm text-muted-foreground mb-4">Crie imagens promocionais ou mockups de produtos usando inteligência artificial.</p>
      </div>
      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ex: Uma pulseira de prata 925 delicada com pingente de coração, fotografada sobre veludo rosa, iluminação suave..."
          rows={4}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
        <Button onClick={handleGenerate} disabled={generateImage.isPending} className="gap-2 bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white">
          <Wand2 className="w-4 h-4" /> {generateImage.isPending ? "Gerando..." : "Gerar Imagem"}
        </Button>
      </div>
      {generatedUrl && (
        <div className="space-y-2">
          <img src={generatedUrl} alt="Gerada por IA" className="w-full max-w-md rounded-xl shadow-lg" />
          <p className="text-xs text-muted-foreground">URL: {generatedUrl}</p>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generatedUrl); toast.success("URL copiada!"); }}>
            Copiar URL
          </Button>
        </div>
      )}
    </div>
  );
}

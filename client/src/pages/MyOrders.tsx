import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

const statusMap: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Pendente", icon: Clock, color: "text-yellow-600" },
  approved: { label: "Aprovado", icon: CheckCircle, color: "text-green-600" },
  shipped: { label: "Enviado", icon: Truck, color: "text-blue-600" },
  delivered: { label: "Entregue", icon: CheckCircle, color: "text-green-700" },
  rejected: { label: "Rejeitado", icon: XCircle, color: "text-red-600" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "text-gray-600" },
};

export default function MyOrders() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) return <div className="container py-20 text-center text-muted-foreground">Carregando...</div>;

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-serif font-bold mb-2">Faça login para ver seus pedidos</h2>
        <a href={getLoginUrl()}>
          <Button className="mt-4 bg-[oklch(0.65_0.12_350)] hover:bg-[oklch(0.55_0.12_350)] text-white">Entrar</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[oklch(0.97_0.015_350)] py-8">
        <div className="container">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h1 className="text-2xl font-serif font-bold">Meus Pedidos</h1>
        </div>
      </div>
      <div className="container py-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => {
              const status = statusMap[order.status] || statusMap.pending;
              const Icon = status.icon;
              return (
                <div key={order.id} className="bg-white rounded-xl border p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-serif font-bold">Pedido #{order.id}</span>
                      <span className="text-xs text-muted-foreground ml-3">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${status.color}`}>
                      <Icon className="w-4 h-4" /> {status.label}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: <strong className="text-foreground">R${parseFloat(order.total).toFixed(2)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Você ainda não fez nenhum pedido</p>
            <Link href="/catalogo"><Button variant="outline" className="mt-4">Ver Catálogo</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}

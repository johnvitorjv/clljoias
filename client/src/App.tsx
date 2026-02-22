import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import SearchResults from "./pages/SearchResults";
import Materials from "./pages/Materials";
import MyOrders from "./pages/MyOrders";
import Admin from "./pages/Admin";
import OrderStatus from "./pages/OrderStatus";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WhatsAppButton from "./components/WhatsAppButton";
import SplashScreen from "./components/SplashScreen";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalogo" component={Catalog} />
      <Route path="/categoria/:slug" component={Category} />
      <Route path="/produto/:slug" component={ProductDetail} />
      <Route path="/carrinho" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/busca" component={SearchResults} />
      <Route path="/materiais" component={Materials} />
      <Route path="/meus-pedidos" component={MyOrders} />
      <Route path="/admin" component={Admin} />
      <Route path="/pedido/:orderId" component={OrderStatus} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <SplashScreen />
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <Header />
              <main className="flex-1">
                <Router />
              </main>
              <Footer />
            </div>
            <CartDrawer />
            <WhatsAppButton />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

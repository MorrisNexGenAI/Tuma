import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import CreatorSignup from "@/pages/CreatorSignup";
import CreatorLogin from "@/pages/CreatorLogin";
import CreatorPortal from "@/pages/CreatorPortal";
import CreatorProfile from "@/pages/CreatorProfile";
import CreatorDashboard from "@/pages/CreatorDashboard";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Check if the current path is an admin route
function isAdminRoute(path: string) {
  return path.startsWith("/admin");
}

// Custom route component for admin routes
function AdminRoute(props: { component: React.ComponentType, path: string }) {
  const { component: Component, path } = props;
  const [location] = useLocation();
  
  return (
    <Route path={path}>
      {isAdminRoute(location) ? (
        <Component />
      ) : null}
    </Route>
  );
}

function Router() {
  const [location] = useLocation();
  const isAdmin = isAdminRoute(location);
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <Header />}
      <main className={`flex-1 ${isAdmin ? 'p-0' : ''}`}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/search" component={SearchResults} />
          <Route path="/creator/signup" component={CreatorSignup} />
          <Route path="/creator/login" component={CreatorLogin} />
          <Route path="/creator/portal" component={CreatorPortal} />
          <Route path="/creator/dashboard" component={CreatorDashboard} />
          <Route path="/creators/:id" component={CreatorProfile} />
          {/* Admin Routes */}
          <AdminRoute path="/admin/login" component={AdminLogin} />
          <AdminRoute path="/admin/dashboard" component={AdminDashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

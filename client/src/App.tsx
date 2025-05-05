import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import CreatorSignup from "@/pages/CreatorSignup";
import Login from "@/pages/CreatorLogin"; // This is our unified login component
import CreatorPortal from "@/pages/CreatorPortal";
import CreatorProfile from "@/pages/CreatorProfile";
import CreatorDashboard from "@/pages/CreatorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";

// Check if the current path is an admin route
function isAdminRoute(path: string) {
  return path.startsWith("/admin");
}

// Authentication status interface 
interface AuthStatus {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userId?: number;
}

// Protected route that requires authentication
function ProtectedRoute(props: { 
  component: React.ComponentType, 
  path: string, 
  adminOnly?: boolean 
}) {
  const { component: Component, path, adminOnly = false } = props;
  
  // Get authentication status
  const { data: authStatus, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false,
  });
  
  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !authStatus?.isLoggedIn ? (
        <Redirect to="/login" />
      ) : adminOnly && !authStatus.isAdmin ? (
        <Redirect to="/creator/portal" />
      ) : (
        <Component />
      )}
    </Route>
  );
}

function Router() {
  const [location] = useLocation();
  const isAdmin = isAdminRoute(location);
  
  // Fetch auth status
  const { data: authStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false,
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <Header />}
      <main className={`flex-1 ${isAdmin ? 'p-0' : ''}`}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/search" component={SearchResults} />
          <Route path="/creator/signup" component={CreatorSignup} />
          <Route path="/login" component={Login} />
          
          {/* Protected Routes */}
          <ProtectedRoute path="/creator/portal" component={CreatorPortal} />
          <ProtectedRoute path="/creator/dashboard" component={CreatorDashboard} />
          
          {/* Public creator profile */}
          <Route path="/creators/:id" component={CreatorProfile} />
          
          {/* Admin Routes */}
          <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly={true} />
          
          {/* Handle redirects */}
          <Route path="/admin/login">
            <Redirect to="/login" />
          </Route>
          <Route path="/creator/login">
            <Redirect to="/login" />
          </Route>
          
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

import { Switch, Route } from "wouter";
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
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/search" component={SearchResults} />
          <Route path="/creator/signup" component={CreatorSignup} />
          <Route path="/creator/login" component={CreatorLogin} />
          <Route path="/creator/portal" component={CreatorPortal} />
          <Route path="/creator/dashboard" component={CreatorDashboard} />
          <Route path="/creators/:id" component={CreatorProfile} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
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

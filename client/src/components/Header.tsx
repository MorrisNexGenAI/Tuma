import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";

const Header = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const { data: creator } = useQuery<{ isLoggedIn: boolean }>({
    queryKey: ["/api/auth/status"],
    retry: false,
    gcTime: 0,
    staleTime: 1000 * 60, // 1 minute
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      navigate("/");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your creator account.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="header">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="gradient-text text-2xl font-bold">Tuma</span>
            <MapPin className="ml-1 text-secondary h-5 w-5" />
          </Link>
          <span className="ml-2 text-sm text-text-secondary px-2 py-0.5 bg-accent/30 rounded-full">Liberia</span>
        </div>
        <div className="flex items-center space-x-4">
          {creator?.isLoggedIn ? (
            <>
              <Link href="/creator/portal" className="btn-outline">
                My Service
              </Link>
              <Link href="/creator/dashboard" className="btn-outline">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/creator/login" className="btn-outline">
                Creator Login
              </Link>
              <Link
                href="/creator/signup"
                className="btn-primary"
              >
                Add Service
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

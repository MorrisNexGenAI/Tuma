import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-primary text-2xl font-bold">Tuma</span>
          </Link>
          <span className="ml-2 text-xs text-text-secondary">Liberia</span>
        </div>
        <div className="flex items-center space-x-4">
          {creator?.isLoggedIn ? (
            <>
              <Link href="/creator/portal" className="text-primary font-medium">
                My Service
              </Link>
              <button
                onClick={handleLogout}
                className="text-text-secondary font-medium"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/creator/login" className="text-primary font-medium">
                Creator Login
              </Link>
              <Link
                href="/creator/signup"
                className="bg-primary text-white px-3 py-1.5 rounded-md font-medium text-sm"
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

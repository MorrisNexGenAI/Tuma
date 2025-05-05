import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Phone, ArrowRight, ShieldCheck } from "lucide-react";

// Form validation schema
const loginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password/PIN is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginResponse {
  message: string;
  isAdmin: boolean;
  user: {
    id: number;
    phone: string;
    fullName?: string;
  };
}

const Login = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      // Invalidate and refetch auth status after login
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      
      // Route based on user type
      if (data.isAdmin) {
        toast({
          title: "Admin login successful",
          description: `Welcome back, ${data.user.fullName || 'Admin'}.`,
        });
        navigate("/admin/dashboard");
      } else {
        toast({
          title: "Login successful",
          description: "Welcome back to your service dashboard.",
        });
        navigate("/creator/portal");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid phone number or password/PIN.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const onSubmit = (data: LoginFormValues) => {
    setIsSubmitting(true);
    loginMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-10 fade-in">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Tuma Login</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-primary" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="tel"
                        placeholder="0770 123 456"
                        className="p-3 pl-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        {...field}
                      />
                      <Phone className="absolute top-1/2 left-3 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Enter your registered phone number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-primary" />
                    Password/PIN
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="Enter your password or PIN"
                        className="p-3 pl-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        {...field}
                      />
                      <Lock className="absolute top-1/2 left-3 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500 flex items-center mt-1">
                    <ShieldCheck className="w-3 h-3 mr-1 text-primary" />
                    Service providers use password, admins use PIN
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="gradient-bg text-white w-full py-3.5 px-4 rounded-md font-medium hover:shadow-lg transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-600 pt-2">
              <p>Don't have an account?</p>
              <Button 
                variant="link" 
                className="text-primary font-medium"
                onClick={() => navigate("/creator/signup")}
              >
                Register a new service
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Login;

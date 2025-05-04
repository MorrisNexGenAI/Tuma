import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Phone, ArrowRight } from "lucide-react";

// Form validation schema
const loginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const CreatorLogin = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "Welcome back to your service dashboard.",
      });
      navigate("/creator/portal");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid phone number or password.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
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
          <h1 className="text-2xl font-bold text-text-primary">Service Provider Login</h1>
          <p className="text-text-secondary mt-2">Access your service dashboard</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-primary" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="tel"
                        placeholder="+231 xx xxx xxxx"
                        className="p-3 pl-9 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        {...field}
                      />
                      <Phone className="absolute top-1/2 left-3 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Enter the phone number you used during registration
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
                  <FormLabel className="text-text-secondary flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-primary" />
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        className="p-3 pl-9 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        {...field}
                      />
                      <Lock className="absolute top-1/2 left-3 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    </div>
                  </FormControl>
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
            
            <div className="text-center text-sm text-text-secondary pt-2">
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

export default CreatorLogin;

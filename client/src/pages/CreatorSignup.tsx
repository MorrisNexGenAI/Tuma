import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form validation schema
const signupSchema = z.object({
  serviceName: z.string().min(3, "Service name must be at least 3 characters"),
  serviceType: z.string().min(1, "Please select a service type"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  county: z.string().min(1, "Please select a county"),
  city: z.string().min(1, "Please select a city"),
  community: z.string().min(1, "Community/area is required"),
  operatingHours: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const CreatorSignup = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      serviceName: "",
      serviceType: "",
      phone: "",
      password: "",
      county: "",
      city: "",
      community: "",
      operatingHours: "",
    },
  });

  // Creator signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormValues) => {
      return apiRequest("POST", "/api/creators", data);
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "Your service has been registered. Please log in.",
      });
      navigate("/creator/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: SignupFormValues) => {
    setIsSubmitting(true);
    signupMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-6 fade-in">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Add Your Service</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Service Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. John's Barbershop"
                      className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Service Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Room">Room</SelectItem>
                      <SelectItem value="Restaurant">Restaurant</SelectItem>
                      <SelectItem value="Barbershop">Barbershop</SelectItem>
                      <SelectItem value="Salon">Salon</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+231 xx xxx xxxx"
                      className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create a password"
                      className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-text-secondary">Location</p>
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="county"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-secondary">County</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                            <SelectValue placeholder="Select county" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Montserrado">Montserrado</SelectItem>
                          <SelectItem value="Margibi">Margibi</SelectItem>
                          <SelectItem value="Bong">Bong</SelectItem>
                          <SelectItem value="Nimba">Nimba</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-secondary">City</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Monrovia">Monrovia</SelectItem>
                          <SelectItem value="Paynesville">Paynesville</SelectItem>
                          <SelectItem value="Gbarnga">Gbarnga</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="community"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">Community/Area</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Sinkor, Old Road"
                        className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="operatingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Operating Hours</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 8:00 AM - 6:00 PM"
                      className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="btn-primary w-full py-3 px-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register Service"}
            </Button>
            
            <p className="text-center text-sm text-text-secondary">
              Already have an account? 
              <Button 
                variant="link" 
                className="text-primary font-medium"
                onClick={() => navigate("/creator/login")}
              >
                Log in
              </Button>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreatorSignup;

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Clock, Building, User } from "lucide-react";

// Form validation schema
const signupSchema = z.object({
  serviceName: z.string().min(3, "Service name must be at least 3 characters"),
  serviceType: z.string().min(1, "Please select a service type"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  country: z.string().default("Liberia"),
  county: z.string().min(1, "County is required"),
  city: z.string().min(1, "City is required"),
  community: z.string().min(1, "Community/area is required"),
  operatingHours: z.string().optional(),
});

// African countries list
const africanCountries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", 
  "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", 
  "Chad", "Comoros", "Congo", "Côte d'Ivoire", "Djibouti", 
  "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", 
  "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", 
  "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", 
  "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", 
  "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe", "Senegal", 
  "Seychelles", "Sierra Leone", "Somalia", "South Africa", 
  "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", 
  "Zambia", "Zimbabwe"
];

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
      country: "Liberia",
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
            
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-primary mb-2">
                <MapPin className="w-5 h-5 mr-2" />
                <p className="text-lg font-medium">Location</p>
              </div>
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">Country</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {africanCountries.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Defaulted to Liberia, but you can change if needed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-3 mt-3">
                <FormField
                  control={form.control}
                  name="county"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-secondary">County</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="e.g. Bomi, Montserrado"
                            className="p-3 pl-9 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            {...field}
                          />
                          <Building className="absolute top-1/2 left-3 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        </div>
                      </FormControl>
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
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="e.g. Tubmanburg, Monrovia"
                            className="p-3 pl-9 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            {...field}
                          />
                          <MapPin className="absolute top-1/2 left-3 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        </div>
                      </FormControl>
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
                      <div className="relative">
                        <Input
                          placeholder="e.g. Sinkor, Old Road"
                          className="p-3 pl-9 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          {...field}
                        />
                        <MapPin className="absolute top-1/2 left-3 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                      </div>
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
                  <FormLabel className="text-text-secondary flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    Operating Hours
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="e.g. 8:00 AM - 6:00 PM"
                        className="p-3 pl-9 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        {...field}
                      />
                      <Clock className="absolute top-1/2 left-3 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Let customers know when they can reach you
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
                  Registering Service...
                </div>
              ) : "Register Your Service"}
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

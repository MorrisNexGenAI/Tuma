import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Service } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Form validation schema
const serviceUpdateSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters"),
  serviceType: z.string().min(1, "Please select a service type"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  county: z.string().min(1, "Please select a county"),
  city: z.string().min(1, "Please select a city"),
  community: z.string().min(1, "Community/area is required"),
  operatingHours: z.string().optional(),
  available: z.boolean().default(true),
});

type ServiceUpdateFormValues = z.infer<typeof serviceUpdateSchema>;

const CreatorPortal = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Get creator's service
  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ["/api/services/me"],
  });

  // Initialize form with service data
  const form = useForm<ServiceUpdateFormValues>({
    resolver: zodResolver(serviceUpdateSchema),
    defaultValues: {
      name: "",
      serviceType: "",
      phone: "",
      county: "",
      city: "",
      community: "",
      operatingHours: "",
      available: true,
    },
  });

  // Update form values when service data is loaded
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        serviceType: service.serviceType,
        phone: service.phone,
        county: service.county,
        city: service.city,
        community: service.community,
        operatingHours: service.operatingHours || "",
        available: service.available === 1,
      });
    }
  }, [service, form]);

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (data: ServiceUpdateFormValues) => {
      return apiRequest("PUT", `/api/services/${service?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Service updated",
        description: "Your service information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services/me"] });
      setIsUpdating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "An error occurred while updating your service.",
        variant: "destructive",
      });
      setIsUpdating(false);
    },
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/services/${service?.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Service deleted",
        description: "Your service has been successfully deleted.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message || "An error occurred while deleting your service.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ServiceUpdateFormValues) => {
    setIsUpdating(true);
    updateServiceMutation.mutate(data);
  };

  // Handle availability toggle
  const handleAvailabilityToggle = (checked: boolean) => {
    form.setValue("available", checked);
    updateServiceMutation.mutate({
      ...form.getValues(),
      available: checked,
    });
  };

  // Handle service deletion
  const handleDeleteService = () => {
    deleteServiceMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 fade-in">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 fade-in">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Service Management</h1>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-background rounded-md mb-6">
          <div>
            <h2 className="font-semibold text-lg">{service?.name}</h2>
            <p className="text-text-secondary">{service?.serviceType}</p>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium">Availability:</span>
            <Switch 
              checked={form.watch("available")}
              onCheckedChange={handleAvailabilityToggle}
            />
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Service Name</FormLabel>
                  <FormControl>
                    <Input
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
                    value={field.value}
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
                        value={field.value}
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
                        value={field.value}
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
                      className="p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2 flex space-x-3">
              <Button 
                type="submit" 
                className="btn-primary flex-1 py-3 px-4"
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Service"}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1 border border-error text-error py-3 px-4 rounded-md font-medium hover:bg-error hover:text-white transition-colors">
                    Delete Service
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your service and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteService} className="bg-error text-white hover:bg-error/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </Form>
      </div>
      
      {/* Service Analytics Preview Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="font-semibold text-lg mb-4">Service Analytics</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-background p-4 rounded-md">
            <p className="text-text-secondary text-sm mb-1">Calls Received</p>
            <p className="text-2xl font-bold text-primary">24</p>
            <p className="text-xs text-text-secondary">Last 30 days</p>
          </div>
          
          <div className="bg-background p-4 rounded-md">
            <p className="text-text-secondary text-sm mb-1">Search Appearances</p>
            <p className="text-2xl font-bold text-primary">143</p>
            <p className="text-xs text-text-secondary">Last 30 days</p>
          </div>
        </div>
        
        <p className="text-center text-sm text-text-secondary">
          Coming soon: Advanced analytics, reviews, and premium features
        </p>
      </div>
    </div>
  );
};

export default CreatorPortal;

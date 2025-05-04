import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Eye, 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  Phone,
  MapPin,
  User
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Service } from "@shared/schema";
import { format, subDays } from "date-fns";

// Analytics data structure
interface AnalyticsData {
  viewsHistory: { date: string; views: number }[];
  totalViews: number;
  contactClicks: number;
  viewsGrowth: number;
  peakHours: { hour: string; views: number }[];
  popularDays: { day: string; views: number }[];
  locationBreakdown: { location: string; percentage: number }[];
}

const CreatorDashboard = () => {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("week");
  
  // Get creator service info
  const { data: service, isLoading: serviceLoading } = useQuery<Service>({
    queryKey: ["/api/services/me"],
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", timeframe],
    queryFn: async () => {
      try {
        const responseData = await apiRequest("GET", `/api/analytics?timeframe=${timeframe}`);
        if (!responseData) {
          console.warn("No analytics data received");
          return null as unknown as AnalyticsData;
        }
        
        // Force the response type to match our expected structure
        const data = responseData as any;
        
        return {
          viewsHistory: Array.isArray(data.viewsHistory) ? data.viewsHistory : [],
          totalViews: typeof data.totalViews === 'number' ? data.totalViews : 0,
          contactClicks: typeof data.contactClicks === 'number' ? data.contactClicks : 0,
          viewsGrowth: typeof data.viewsGrowth === 'number' ? data.viewsGrowth : 0,
          peakHours: Array.isArray(data.peakHours) ? data.peakHours : [],
          popularDays: Array.isArray(data.popularDays) ? data.popularDays : [],
          locationBreakdown: Array.isArray(data.locationBreakdown) ? data.locationBreakdown : []
        } as AnalyticsData;
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        return null as unknown as AnalyticsData;
      }
    },
  });
  
  // Handle data loading state
  const isLoading = serviceLoading || analyticsLoading;
  
  // Format percentage change with + or - sign
  const formatPercentage = (value: number) => {
    return value > 0 ? `+${value}%` : `${value}%`;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-72 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Generate empty analytics data for cases when no data is available yet
  const emptyAnalyticsData: AnalyticsData = {
    viewsHistory: [
      { date: format(new Date(), 'EEE'), views: 0 },
    ],
    totalViews: 0,
    contactClicks: 0, 
    viewsGrowth: 0,
    peakHours: [
      { hour: "8-10 AM", views: 0 },
    ],
    popularDays: [
      { day: "Monday", views: 0 },
      { day: "Tuesday", views: 0 },
      { day: "Wednesday", views: 0 },
      { day: "Thursday", views: 0 },
      { day: "Friday", views: 0 },
      { day: "Saturday", views: 0 },
      { day: "Sunday", views: 0 },
    ],
    locationBreakdown: [
      { location: "Montserrado", percentage: 0 },
    ],
  };
  
  // Use real data with fallback to empty analytics data if not yet available
  const data = analyticsData || emptyAnalyticsData;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Analytics Dashboard</h1>
            <p className="text-text-secondary">
              Track your service performance and visitor insights
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Tabs 
              value={timeframe}
              onValueChange={(value) => setTimeframe(value as "week" | "month" | "all")}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="all">All time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Key metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total views */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Eye className="mr-2 h-5 w-5 text-primary" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-bold">{data.totalViews}</div>
                  <div className="flex items-center mt-1 text-sm">
                    {data.viewsGrowth >= 0 ? (
                      <>
                        <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                        <span className="text-green-600">{formatPercentage(data.viewsGrowth)}</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                        <span className="text-red-600">{formatPercentage(data.viewsGrowth)}</span>
                      </>
                    )}
                    <span className="text-text-secondary ml-1">vs previous period</span>
                  </div>
                </div>
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <Eye className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Contact clicks */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Phone className="mr-2 h-5 w-5 text-primary" />
                Contact Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-bold">{data.contactClicks}</div>
                  <div className="flex items-center mt-1 text-sm">
                    <span className="text-text-secondary">
                      {Math.round((data.contactClicks / data.totalViews) * 100)}% conversion rate
                    </span>
                  </div>
                </div>
                <div className="bg-green-100 text-green-600 p-3 rounded-full">
                  <Phone className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Availability status */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-medium mb-1">
                    {service?.available === 1 ? (
                      <span className="text-green-600">Available</span>
                    ) : (
                      <span className="text-gray-500">Unavailable</span>
                    )}
                  </div>
                  <Link 
                    to="/creator/portal" 
                    className="text-primary hover:underline text-sm inline-flex items-center"
                  >
                    Update status
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
                <div className={service?.available === 1 
                  ? "bg-green-100 text-green-600 p-3 rounded-full"
                  : "bg-gray-100 text-gray-500 p-3 rounded-full"
                }>
                  <User className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Traffic overview chart */}
        <Card className="border border-border mb-8">
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>
              View count trends over the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.viewsHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="views" 
                    name="Views" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Secondary charts and insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Peak hours */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Peak Hours
              </CardTitle>
              <CardDescription>
                When your service gets the most views
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="views" 
                      name="Views" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Location breakdown */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Visitor Locations
              </CardTitle>
              <CardDescription>
                Geographic distribution of your visitors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.locationBreakdown.map((location: { location: string; percentage: number }, index: number) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{location.location}</span>
                    <span className="text-sm text-text-secondary">{location.percentage}%</span>
                  </div>
                  <Progress value={location.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Popular days of week */}
        <Card className="border border-border mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Popular Days
            </CardTitle>
            <CardDescription>
              Which days of the week get the most traffic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.popularDays}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="views" 
                    name="Total Views" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Actions section */}
        <div className="mt-8 flex justify-end">
          <Link to="/creator/portal">
            <Button>
              Update Service
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
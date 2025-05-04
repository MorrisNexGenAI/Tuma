import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  Users,
  Bell,
  BarChart3,
  LogOut,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface SystemStats {
  totalCreators: number;
  activeCreators: number;
  totalServices: number;
  newCreatorsToday: number;
  dailyViews: number;
  totalViews: number;
  populatedCounties: { name: string; count: number }[];
  serviceTypeDistribution: { type: string; count: number }[];
  creatorGrowthData: { date: string; count: number }[];
}

// Colors for the pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const AdminDashboard = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch admin status to check if logged in
  const { data: authStatus, isLoading: checkingAuth } = useQuery({
    queryKey: ["/api/admin/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/status");
      if (!res.ok) {
        throw new Error("Failed to check auth status");
      }
      return res.json();
    },
  });

  // Redirect to login page if not logged in
  useEffect(() => {
    if (!checkingAuth && authStatus && !authStatus.isLoggedIn) {
      setLocation("/admin/login");
    }
  }, [authStatus, checkingAuth, setLocation]);

  // Fetch system stats
  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useQuery<SystemStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats");
      if (!res.ok) {
        throw new Error("Failed to fetch system stats");
      }
      return res.json();
    },
    enabled: authStatus?.isLoggedIn,
  });

  // Fetch admin logs
  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ["/api/admin/logs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/logs");
      if (!res.ok) {
        throw new Error("Failed to fetch admin logs");
      }
      return res.json();
    },
    enabled: authStatus?.isLoggedIn && activeTab === "logs",
  });

  // Fetch login activity
  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ["/api/admin/activity"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/activity");
      if (!res.ok) {
        throw new Error("Failed to fetch login activity");
      }
      return res.json();
    },
    enabled: authStatus?.isLoggedIn && activeTab === "activity",
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/logout");
      if (!res.ok) {
        throw new Error("Logout failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/admin/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authStatus?.isLoggedIn) {
    return null; // Will redirect to login page via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Tuma Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetchStats()} 
              title="Refresh stats"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto p-6">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="creators">
              <Users className="h-4 w-4 mr-2" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Bell className="h-4 w-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="logs">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 4V6.5M14 11V13.5M14 18V20.5M4 6.5H14M4 13.5H14M4 20.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loadingStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Creators
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.totalCreators}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.newCreatorsToday} new today
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Creators
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.activeCreators}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((stats.activeCreators / stats.totalCreators) * 100).toFixed(1)}% active rate
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.totalServices}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(stats.totalServices / stats.totalCreators).toFixed(1)} per creator
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Views
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.totalViews}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.dailyViews} views today
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Creator Growth</CardTitle>
                      <CardDescription>New registrations over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={stats.creatorGrowthData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="count"
                              name="New Creators"
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Service Types</CardTitle>
                      <CardDescription>Distribution by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.serviceTypeDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="type"
                            >
                              {stats.serviceTypeDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Geographic Distribution</CardTitle>
                      <CardDescription>Services by county</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={stats.populatedCounties}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar 
                              dataKey="count" 
                              name="Services" 
                              fill="#8884d8" 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-10">
                  <p className="text-center text-muted-foreground">Failed to load system stats</p>
                  <div className="flex justify-center mt-4">
                    <Button onClick={() => refetchStats()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other tabs will be implemented in future iterations */}
          <TabsContent value="creators">
            <Card>
              <CardHeader>
                <CardTitle>Creator Management</CardTitle>
                <CardDescription>
                  This feature will be implemented in future iterations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  In this section, you will be able to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>View all creators and their services</li>
                  <li>Verify creator accounts and services</li>
                  <li>Warning creators about policy violations</li>
                  <li>Suspend or delete accounts if needed</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Announcement Management</CardTitle>
                <CardDescription>
                  This feature will be implemented in future iterations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  In this section, you will be able to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Create platform-wide announcements</li>
                  <li>Target specific audiences (all users, specific regions)</li>
                  <li>Set priorities and display durations</li>
                  <li>Manage active and scheduled announcements</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  This feature will be implemented in future iterations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  In this section, you will be able to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>View detailed platform analytics</li>
                  <li>Track user engagement metrics</li>
                  <li>Monitor service performance</li>
                  <li>Generate custom reports</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Admin Logs</CardTitle>
                <CardDescription>Recent administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : logs && logs.length > 0 ? (
                  <div className="space-y-6">
                    {logs.map((log: any, index: number) => (
                      <div key={log.id} className="space-y-2">
                        {index > 0 && <Separator />}
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground">
                              Target: {log.targetType} {log.targetId ? `#${log.targetId}` : ''}
                            </p>
                            {log.details && (
                              <p className="text-sm mt-1">{log.details}</p>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No admin logs found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
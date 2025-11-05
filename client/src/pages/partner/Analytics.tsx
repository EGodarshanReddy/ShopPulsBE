import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, PARTNER_NAV_ITEMS } from "@/lib/constants";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function Analytics() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [dateRange, setDateRange] = useState<"week" | "month">("week");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    } else if (!isAuthLoading && user && user.userType !== "partner") {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch analytics data
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PARTNER_ANALYTICS],
    enabled: !!user
  });
  
  // Format analytics data for charts
  const formatChartData = () => {
    if (!analyticsData || !analyticsData.stats) return [];
    
    return analyticsData.stats.map((stat: any) => ({
      date: formatDate(stat.date),
      storeViews: stat.storeViews,
      dealViews: stat.dealViews,
      scheduledVisits: stat.scheduledVisits,
      actualVisits: stat.actualVisits,
    }));
  };
  
  const chartData = formatChartData();
  
  // Calculate conversion rate
  const calculateConversionRate = () => {
    if (!analyticsData || !analyticsData.totals) return 0;
    
    const { scheduledVisits, actualVisits } = analyticsData.totals;
    if (scheduledVisits === 0) return 0;
    
    return Math.round((actualVisits / scheduledVisits) * 100);
  };
  
  const conversionRate = calculateConversionRate();
  
  return (
    <div className="screen">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/partner/home")}
            className="mr-4"
          >
            <span className="material-icons text-neutral-700">arrow_back</span>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-800">Analytics</h1>
        </div>
      </div>
      
      <div className="p-4">
        {/* Stats Overview */}
        {isAnalyticsLoading ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-white p-4 rounded-xl shadow-md">
              <p className="text-sm text-neutral-600 mb-1">Store Views</p>
              <p className="text-2xl font-bold text-neutral-800">
                {analyticsData?.totals?.storeViews || 0}
              </p>
              <p className="text-xs text-success flex items-center">
                <span className="material-icons text-xs mr-1">arrow_upward</span>
                <span>12% from last week</span>
              </p>
            </Card>
            
            <Card className="bg-white p-4 rounded-xl shadow-md">
              <p className="text-sm text-neutral-600 mb-1">Deal Views</p>
              <p className="text-2xl font-bold text-neutral-800">
                {analyticsData?.totals?.dealViews || 0}
              </p>
              <p className="text-xs text-success flex items-center">
                <span className="material-icons text-xs mr-1">arrow_upward</span>
                <span>8% from last week</span>
              </p>
            </Card>
            
            <Card className="bg-white p-4 rounded-xl shadow-md">
              <p className="text-sm text-neutral-600 mb-1">Scheduled Visits</p>
              <p className="text-2xl font-bold text-neutral-800">
                {analyticsData?.totals?.scheduledVisits || 0}
              </p>
              <p className="text-xs text-success flex items-center">
                <span className="material-icons text-xs mr-1">arrow_upward</span>
                <span>5% from last week</span>
              </p>
            </Card>
            
            <Card className="bg-white p-4 rounded-xl shadow-md">
              <p className="text-sm text-neutral-600 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-neutral-800">
                {conversionRate}%
              </p>
              <p className="text-xs text-neutral-500">
                Visits / Scheduled
              </p>
            </Card>
          </div>
        )}
        
        {/* Charts */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-neutral-800">Performance Trends</h2>
            <div className="flex space-x-2">
              <Button 
                variant={dateRange === "week" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDateRange("week")}
              >
                Week
              </Button>
              <Button 
                variant={dateRange === "month" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDateRange("month")}
              >
                Month
              </Button>
            </div>
          </div>
          
          {isAnalyticsLoading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : (
            <Card className="p-4 rounded-xl mb-6">
              <Tabs defaultValue="views">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="views">Views</TabsTrigger>
                  <TabsTrigger value="visits">Visits</TabsTrigger>
                </TabsList>
                
                <TabsContent value="views" className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.split(",")[0]} 
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="storeViews"
                        name="Store Views"
                        stroke="#2196F3"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="dealViews"
                        name="Deal Views"
                        stroke="#FF5722"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="visits" className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.split(",")[0]} 
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="scheduledVisits"
                        name="Scheduled"
                        fill="#FFC107"
                      />
                      <Bar
                        dataKey="actualVisits"
                        name="Actual"
                        fill="#4CAF50"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
        
        {/* Popular Deals */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Popular Deals</h2>
          
          {isAnalyticsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <Card className="p-4 rounded-xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2 border-b">
                  <div className="flex items-center">
                    <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Weekend Special Buffet</p>
                      <p className="text-xs text-neutral-500">25% Discount</p>
                    </div>
                  </div>
                  <p className="font-bold text-neutral-800">42 views</p>
                </div>
                
                <div className="flex justify-between items-center p-2 border-b">
                  <div className="flex items-center">
                    <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Family Package</p>
                      <p className="text-xs text-neutral-500">15% Discount</p>
                    </div>
                  </div>
                  <p className="font-bold text-neutral-800">28 views</p>
                </div>
                
                <div className="flex justify-between items-center p-2">
                  <div className="flex items-center">
                    <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Complimentary Drink</p>
                      <p className="text-xs text-neutral-500">Freebie</p>
                    </div>
                  </div>
                  <p className="font-bold text-neutral-800">16 views</p>
                </div>
              </div>
            </Card>
          )}
        </div>
        
        {/* Insights */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Insights</h2>
          
          <Card className="p-4 rounded-xl">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-success/10 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="material-icons text-success text-sm">trending_up</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-800">Increasing Visits</h3>
                  <p className="text-sm text-neutral-600">Your store visits are up 12% compared to last week. Keep up the good work!</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-warning/10 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="material-icons text-warning text-sm">lightbulb</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-800">Weekend Opportunity</h3>
                  <p className="text-sm text-neutral-600">You get more visitors on weekends. Consider creating weekend-specific deals.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-info/10 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="material-icons text-secondary text-sm">schedule</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-800">Conversion Timing</h3>
                  <p className="text-sm text-neutral-600">Most customers visit within 2 days of viewing your deals. Follow up promptly with scheduled visits.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation items={PARTNER_NAV_ITEMS} />
    </div>
  );
}

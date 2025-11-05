import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, PARTNER_NAV_ITEMS } from "@/lib/constants";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ScheduledVisits() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    } else if (!isAuthLoading && user && user.userType !== "partner") {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch visits data
  const { data: visitsData, isLoading: isVisitsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PARTNER_VISITS],
    enabled: !!user
  });
  
  // Complete visit mutation
  const completeVisitMutation = useMutation({
    mutationFn: (visitId: number) => {
      return apiRequest("POST", API_ENDPOINTS.PARTNER_VISIT_COMPLETE(visitId), {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PARTNER_VISITS] });
      toast({
        title: "Visit Completed",
        description: "The visit has been marked as completed successfully."
      });
      setConfirmCompleteOpen(false);
    },
    onError: (error) => {
      console.error("Failed to complete visit:", error);
      toast({
        title: "Action Failed",
        description: "There was an error completing the visit. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleCompleteVisit = (visit: any) => {
    setSelectedVisit(visit);
    setConfirmCompleteOpen(true);
  };
  
  const confirmComplete = () => {
    if (selectedVisit) {
      completeVisitMutation.mutate(selectedVisit.id);
    }
  };
  
  const getFormattedVisitDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };
  
  const getStatusBadge = (status: string) => {
    if (status === "scheduled") {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Scheduled</Badge>;
    } else if (status === "completed") {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
    } else if (status === "cancelled") {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };
  
  // Filter visits based on tab
  const filterVisits = (visits: any[]) => {
    if (!visits) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return visits.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      
      if (activeTab === "upcoming") {
        return visit.status === "scheduled" && visitDate >= today;
      } else if (activeTab === "completed") {
        return visit.status === "completed";
      } else if (activeTab === "cancelled") {
        return visit.status === "cancelled";
      }
      
      return true;
    });
  };
  
  const filteredVisits = visitsData ? filterVisits(visitsData) : [];
  
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
          <h1 className="text-2xl font-bold text-neutral-800">Scheduled Visits</h1>
        </div>
      </div>
      
      <div className="p-4">
        <Tabs 
          defaultValue={activeTab} 
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {isVisitsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : filteredVisits.length > 0 ? (
          <div className="space-y-4">
            {filteredVisits.map((visit) => (
              <Card key={visit.id} className="p-4 rounded-xl shadow-sm">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 bg-primary text-white mr-3">
                      <span className="text-sm">
                        {visit.user?.firstName?.[0]}{visit.user?.lastName?.[0]}
                      </span>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-neutral-800">
                        {visit.user?.firstName} {visit.user?.lastName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {visit.user?.phone}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(visit.status)}
                </div>
                
                <div className="mb-2">
                  <p className="text-neutral-600 text-sm mb-1">
                    <span className="material-icons text-sm align-middle mr-1">event</span>
                    {getFormattedVisitDate(visit.visitDate)}
                  </p>
                  
                  {visit.deal && (
                    <p className="text-neutral-600 text-sm">
                      <span className="material-icons text-sm align-middle mr-1">local_offer</span>
                      Deal: {visit.deal.name}
                    </p>
                  )}
                  
                  {visit.notes && (
                    <p className="text-neutral-600 text-sm mt-1">
                      <span className="material-icons text-sm align-middle mr-1">note</span>
                      Notes: {visit.notes}
                    </p>
                  )}
                </div>
                
                {activeTab === "upcoming" && (
                  <div className="flex space-x-2 mt-3">
                    <Button
                      variant="outline"
                      className="bg-neutral-100 text-neutral-700 text-sm py-2 px-3 rounded-lg flex items-center hover:bg-neutral-200"
                      onClick={() => {
                        window.location.href = `tel:${visit.user?.phone}`;
                      }}
                    >
                      <span className="material-icons text-sm mr-1">call</span>
                      <span>Contact</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="bg-neutral-100 text-neutral-700 text-sm py-2 px-3 rounded-lg flex items-center hover:bg-neutral-200"
                      onClick={() => handleCompleteVisit(visit)}
                    >
                      <span className="material-icons text-sm mr-1">check</span>
                      <span>Mark as Visited</span>
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="material-icons text-4xl text-neutral-300 mb-2">calendar_today</span>
            <p className="text-neutral-500 text-center">
              {activeTab === "upcoming" ? "No upcoming scheduled visits" : 
               activeTab === "completed" ? "No completed visits yet" : 
               "No cancelled visits"}
            </p>
          </div>
        )}
      </div>
      
      {/* Confirm Complete Dialog */}
      <Dialog open={confirmCompleteOpen} onOpenChange={setConfirmCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Visit as Completed</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to mark this visit as completed? This will generate reward points for the customer.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCompleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmComplete}
              disabled={completeVisitMutation.isPending}
            >
              {completeVisitMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bottom Navigation */}
      <BottomNavigation items={PARTNER_NAV_ITEMS} />
    </div>
  );
}
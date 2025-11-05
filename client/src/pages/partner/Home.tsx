import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, PARTNER_NAV_ITEMS } from "@/lib/constants";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { PartnerRewardsCard } from "@/components/RewardsCard";
import { PartnerDealCard } from "@/components/DealCard";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerHome() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    } else if (!isAuthLoading && user && user.userType !== "partner") {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch store data
  const { data: storeData, isLoading: isStoreLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PARTNER_STORE],
    enabled: !!user
  });
  
  // Fetch deals
  const { data: dealsData, isLoading: isDealsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PARTNER_DEALS],
    enabled: !!user
  });
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PARTNER_ANALYTICS],
    enabled: !!user
  });
  
  // Fetch scheduled visits
  const { data: visitsData, isLoading: isVisitsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PARTNER_VISITS],
    enabled: !!user
  });
  
  // Fetch redemptions
  const { data: redemptionsData, isLoading: isRedemptionsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PARTNER_REDEMPTIONS],
    enabled: !!user
  });
  
  // Navigate to edit profile
  const handleEditProfile = () => {
    navigate("/partner/profile");
  };
  
  // Navigate to add deal
  const handleAddDeal = () => {
    navigate("/partner/add-deal");
  };
  
  // Navigate to edit deal
  const handleEditDeal = (dealId: number) => {
    navigate(`/partner/edit-deal/${dealId}`);
  };
  
  // Toggle deal activation status
  const handleToggleDeal = (dealId: number, isActive: boolean) => {
    if (isActive) {
      // Deactivate the deal (would make API call in real implementation)
      toast({
        title: "Deal Paused",
        description: "The deal has been paused and is no longer visible to customers."
      });
    } else {
      // Activate the deal (would make API call in real implementation)
      toast({
        title: "Deal Activated",
        description: "The deal is now visible to customers."
      });
    }
  };
  
  return (
    <div className="screen">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">ODeals! Business</h1>
            <p className="text-sm text-neutral-600">
              Welcome, {isStoreLoading ? "Loading..." : storeData?.name || "Partner"}
            </p>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="p-2 mr-2">
              <span className="material-icons text-neutral-700">notifications</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-2 mr-2"
              onClick={() => navigate("/partner/profile")}
            >
              <span className="material-icons text-neutral-700">account_circle</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-2"
              onClick={() => {
                logout();
                navigate("/welcome");
                toast({
                  title: "Logged out",
                  description: "You have been successfully logged out."
                });
              }}
            >
              <span className="material-icons text-neutral-700">logout</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* Store Status */}
        <Card className="bg-gradient-to-r from-secondary to-blue-500 p-4 rounded-xl shadow-md mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-white font-bold text-lg">Store Status</h2>
            <Button 
              variant="secondary"
              className="bg-white/20 text-white text-sm py-1 px-3 rounded-lg hover:bg-white/30"
              onClick={handleEditProfile}
            >
              Edit Profile
            </Button>
          </div>
          <div className="text-white text-sm mb-2">
            <div className="flex items-center mb-1">
              <span className="material-icons text-sm mr-1">storefront</span>
              <span>
                {isDealsLoading 
                  ? "Loading deals..." 
                  : `${dealsData?.filter(d => d.isActive).length || 0} Active Deal${dealsData?.filter(d => d.isActive).length !== 1 ? 's' : ''}`
                }
              </span>
            </div>
            <div className="flex items-center">
              <span className="material-icons text-sm mr-1">visibility</span>
              <span>
                {isAnalyticsLoading 
                  ? "Loading stats..." 
                  : `${analyticsData?.totals?.storeViews || 0} Store Views This Week`
                }
              </span>
            </div>
          </div>
        </Card>
        
        {/* Reward Balance */}
        {isRedemptionsLoading ? (
          <Skeleton className="h-32 w-full mb-6" />
        ) : (
          <PartnerRewardsCard
            amountDue={(redemptionsData?.totalDueAmount || 0)}
            onViewHistory={() => {/* Navigate to redemption history */}}
            className="mb-6"
          />
        )}
        
        {/* Deals Management */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-neutral-800">Your Deals</h2>
            <Button 
              className="bg-primary text-white text-sm py-2 px-4 rounded-lg flex items-center hover:bg-primary/90"
              onClick={handleAddDeal}
            >
              <span className="material-icons text-sm mr-1">add</span>
              <span>Add Deal</span>
            </Button>
          </div>
          
          {isDealsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : dealsData && dealsData.length > 0 ? (
            dealsData.map((deal) => (
              <PartnerDealCard
                key={deal.id}
                {...deal}
                isActive={deal.isActive}
                onEdit={() => handleEditDeal(deal.id)}
                onToggle={() => handleToggleDeal(deal.id, deal.isActive)}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <span className="material-icons text-4xl text-neutral-300 mb-2">local_offer</span>
              <p className="text-neutral-600 mb-4">You haven't created any deals yet</p>
              <Button className="bg-primary text-white" onClick={handleAddDeal}>
                Create Your First Deal
              </Button>
            </Card>
          )}
        </div>
        
        {/* Dashboard Analytics */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Analytics</h2>
          
          {isAnalyticsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-56 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card className="bg-white p-4 rounded-xl shadow-md">
                  <p className="text-sm text-neutral-600 mb-1">Store Views</p>
                  <p className="text-xl font-bold text-neutral-800">
                    {analyticsData?.totals?.storeViews || 0}
                  </p>
                  <p className="text-xs text-success flex items-center">
                    <span className="material-icons text-xs mr-1">arrow_upward</span>
                    <span>12% from last week</span>
                  </p>
                </Card>
                
                <Card className="bg-white p-4 rounded-xl shadow-md">
                  <p className="text-sm text-neutral-600 mb-1">Deal Views</p>
                  <p className="text-xl font-bold text-neutral-800">
                    {analyticsData?.totals?.dealViews || 0}
                  </p>
                  <p className="text-xs text-success flex items-center">
                    <span className="material-icons text-xs mr-1">arrow_upward</span>
                    <span>8% from last week</span>
                  </p>
                </Card>
              </div>
              
              <Card className="bg-white p-4 rounded-xl shadow-md mb-4">
                <h3 className="font-medium text-neutral-800 mb-3">Weekly Views</h3>
                <div className="h-40 flex items-end justify-between px-2">
                  {analyticsData?.stats?.map((stat, index) => (
                    <div
                      key={index}
                      className={`w-8 ${
                        new Date(stat.date).getDay() === new Date().getDay()
                        ? "bg-primary"
                        : "bg-secondary"
                      } rounded-t-lg`}
                      style={{
                        height: `${Math.max(
                          (stat.storeViews / (analyticsData.totals.storeViews || 1)) * 100,
                          10
                        )}%`,
                      }}
                    ></div>
                  ))}
                  {!analyticsData?.stats?.length && (
                    <>
                      <div className="w-8 bg-secondary rounded-t-lg h-16"></div>
                      <div className="w-8 bg-secondary rounded-t-lg h-24"></div>
                      <div className="w-8 bg-secondary rounded-t-lg h-12"></div>
                      <div className="w-8 bg-secondary rounded-t-lg h-32"></div>
                      <div className="w-8 bg-secondary rounded-t-lg h-24"></div>
                      <div className="w-8 bg-primary rounded-t-lg h-36"></div>
                      <div className="w-8 bg-secondary rounded-t-lg h-28"></div>
                    </>
                  )}
                </div>
                <div className="flex justify-between px-2 mt-2 text-xs text-neutral-600">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </Card>
              
              <Button 
                variant="outline"
                className="w-full bg-neutral-100 text-neutral-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center hover:bg-neutral-200"
                onClick={() => navigate("/partner/analytics")}
              >
                <span className="material-icons text-sm mr-1">analytics</span>
                <span>View Detailed Analytics</span>
              </Button>
            </>
          )}
        </div>
        
        {/* Scheduled Visits */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-neutral-800">Scheduled Visits</h2>
            <span className="text-sm text-neutral-500">This Week</span>
          </div>
          
          {isVisitsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : visitsData && visitsData.length > 0 ? (
            visitsData.slice(0, 2).map((visit) => (
              <Card key={visit.id} className="bg-white rounded-xl overflow-hidden shadow-md mb-4">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-neutral-800">
                      {visit.user?.firstName} {visit.user?.lastName}
                    </h3>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                      {new Date(visit.visitDate).toLocaleDateString(undefined, { weekday: 'long' })}
                    </span>
                  </div>
                  
                  {visit.deal && (
                    <p className="text-sm text-neutral-600 mb-3">
                      Interested in "{visit.deal.name}"
                    </p>
                  )}
                  
                  <div className="flex">
                    <Button
                      variant="secondary"
                      className="bg-secondary text-white text-sm py-2 px-3 rounded-lg mr-2 flex items-center hover:bg-secondary/90"
                    >
                      <span className="material-icons text-sm mr-1">call</span>
                      <span>Contact</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="bg-neutral-100 text-neutral-700 text-sm py-2 px-3 rounded-lg flex items-center hover:bg-neutral-200"
                    >
                      <span className="material-icons text-sm mr-1">check</span>
                      <span>Mark as Visited</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-neutral-600">No scheduled visits for this week</p>
            </Card>
          )}
          
          {visitsData && visitsData.length > 2 && (
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => navigate("/partner/visits")}
            >
              View All Visits
            </Button>
          )}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation items={PARTNER_NAV_ITEMS} />
    </div>
  );
}

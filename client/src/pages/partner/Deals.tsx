import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, PARTNER_NAV_ITEMS } from "@/lib/constants";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { PartnerDealCard } from "@/components/DealCard";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerDeals() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    } else if (!isAuthLoading && user && user.userType !== "partner") {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch deals
  const { data: dealsData = [], isLoading: isDealsLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.PARTNER_DEALS],
    enabled: !!user
  });
  
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
    <div className="screen pb-20">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Manage Deals</h1>
            <p className="text-sm text-neutral-600">
              Create and manage your offers
            </p>
          </div>
          <Button 
            className="bg-primary text-white text-sm py-2 px-4 rounded-lg flex items-center hover:bg-primary/90"
            onClick={handleAddDeal}
          >
            <span className="material-icons text-sm mr-1">add</span>
            <span>New Deal</span>
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        {/* Active Deals */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Active Deals</h2>
          
          {isDealsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : dealsData && dealsData.filter((d: any) => d.isActive).length > 0 ? (
            dealsData.filter((d: any) => d.isActive).map((deal: any) => (
              <PartnerDealCard
                key={deal.id}
                {...deal}
                isActive={deal.isActive}
                onEdit={() => handleEditDeal(deal.id)}
                onToggle={() => handleToggleDeal(deal.id, deal.isActive)}
              />
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-neutral-600">No active deals found</p>
            </Card>
          )}
        </div>
        
        {/* Inactive Deals */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Inactive Deals</h2>
          
          {isDealsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : dealsData && dealsData.filter((d: any) => !d.isActive).length > 0 ? (
            dealsData.filter((d: any) => !d.isActive).map((deal: any) => (
              <PartnerDealCard
                key={deal.id}
                {...deal}
                isActive={deal.isActive}
                onEdit={() => handleEditDeal(deal.id)}
                onToggle={() => handleToggleDeal(deal.id, deal.isActive)}
              />
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-neutral-600">No inactive deals found</p>
            </Card>
          )}
        </div>
        
        {/* Create Deal CTA */}
        {(dealsData.length === 0) && (
          <Card className="p-8 text-center mt-8">
            <span className="material-icons text-4xl text-neutral-300 mb-2">local_offer</span>
            <p className="text-neutral-600 mb-4">You haven't created any deals yet</p>
            <Button className="bg-primary text-white" onClick={handleAddDeal}>
              Create Your First Deal
            </Button>
          </Card>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation items={PARTNER_NAV_ITEMS} />
    </div>
  );
}
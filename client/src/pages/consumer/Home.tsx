import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { RewardsCard } from "@/components/RewardsCard";
import { StoreCard } from "@/components/StoreCard";
import { DealCard } from "@/components/DealCard";
import { CategoryFilterSelector } from "@/components/CategorySelector";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { CONSUMER_NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

export default function ConsumerHome() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch user rewards
  const { data: rewardsData } = useQuery({
    queryKey: [API_ENDPOINTS.CONSUMER_REWARDS],
    enabled: !!user
  });
  
  // Fetch featured deals
  const { data: dealsData, isLoading: isDealsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.DEALS],
    enabled: !!user
  });
  
  // Fetch nearby stores
  const { data: storesData, isLoading: isStoresLoading } = useQuery({
    queryKey: [API_ENDPOINTS.STORES],
    enabled: !!user
  });
  
  // Filter deals by category
  const filteredDeals = selectedCategory 
    ? dealsData?.filter(deal => deal.category === selectedCategory) 
    : dealsData;
  
  // Handle rewards redemption
  const handleRedeemRewards = () => {
    navigate("/consumer/rewards");
  };
  
  return (
    <div className="screen">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">ODeals!</h1>
            <div className="flex items-center text-neutral-600">
              <span className="material-icons text-sm mr-1">location_on</span>
              <span className="text-sm">Koramangala, Bangalore</span>
            </div>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="p-2 mr-2">
              <span className="material-icons text-neutral-700">notifications</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-2 mr-2"
              onClick={() => navigate("/consumer/profile")}
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
        
        <div className="relative">
          <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
            search
          </span>
          <Input
            type="search"
            placeholder="Search stores or deals"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-100 rounded-full py-3 pl-10 pr-4"
          />
        </div>
      </div>
      
      <div className="p-4">
        {/* Rewards Card */}
        <RewardsCard
          totalPoints={rewardsData?.totalPoints || 0}
          onRedeem={handleRedeemRewards}
          className="mb-6"
        />
        
        {/* Categories Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Categories</h2>
          <CategoryFilterSelector
            selectedCategory={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>
        
        {/* Featured Deals */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-neutral-800">Featured Deals</h2>
            <Button
              variant="link"
              className="text-secondary text-sm font-medium p-0"
              onClick={() => navigate("/consumer/explore")}
            >
              View All
            </Button>
          </div>
          
          {isDealsLoading ? (
            <div className="flex space-x-4 py-2">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 h-56 bg-neutral-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredDeals && filteredDeals.length > 0 ? (
            <div className="flex overflow-x-auto py-2 space-x-4 no-scrollbar">
              {filteredDeals.slice(0, 5).map((deal) => (
                <DealCard
                  key={deal.id}
                  {...deal}
                  onClick={() => navigate(`/consumer/store/${deal.partnerId}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-32 bg-neutral-50 rounded-xl">
              <p className="text-neutral-500">No deals available</p>
            </div>
          )}
        </div>
        
        {/* Nearby Stores */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Nearby Stores</h2>
          
          {isStoresLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : storesData && storesData.length > 0 ? (
            <div>
              {storesData.slice(0, 5).map((store) => (
                <StoreCard
                  key={store.id}
                  {...store}
                  onClick={() => navigate(`/consumer/store/${store.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-32 bg-neutral-50 rounded-xl">
              <p className="text-neutral-500">No stores nearby</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation items={CONSUMER_NAV_ITEMS} />
    </div>
  );
}

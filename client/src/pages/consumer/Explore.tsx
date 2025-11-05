import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { CategoryFilterSelector } from "@/components/CategorySelector";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { CONSUMER_NAV_ITEMS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealCard } from "@/components/DealCard";
import { StoreCard } from "@/components/StoreCard";
import { useAuth } from "@/contexts/AuthContext";

interface Deal {
  id: number;
  partnerId: number;
  name: string;
  description: string;
  dealType: string;
  discountPercentage?: number;
  startDate: string;
  endDate: string;
  category: string;
  images: string[];
  isActive: boolean;
}

interface Store {
  id: number;
  userId: number;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  latitude: number;
  longitude: number;
  logo?: string;
  coverImage?: string;
  businessHours: Record<string, { open: string; close: string; isOpen: boolean }>;
  rating?: number;
  reviewCount?: number;
}

export default function ConsumerExplore() {
  const [, navigate] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("deals");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch deals
  const { data: dealsData = [], isLoading: isDealsLoading } = useQuery<Deal[]>({
    queryKey: [API_ENDPOINTS.DEALS, searchQuery, selectedCategory],
    queryFn: async () => {
      let url = API_ENDPOINTS.DEALS;
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append("query", searchQuery);
      }
      
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch deals");
      return res.json();
    },
    enabled: !!user
  });
  
  // Fetch stores
  const { data: storesData = [], isLoading: isStoresLoading } = useQuery<Store[]>({
    queryKey: [API_ENDPOINTS.STORES, searchQuery, selectedCategory],
    queryFn: async () => {
      let url = API_ENDPOINTS.STORES;
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append("query", searchQuery);
      }
      
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch stores");
      return res.json();
    },
    enabled: !!user
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is already handled by the useQuery dependencies
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Render deals content
  const renderDealsContent = () => {
    if (isDealsLoading) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="h-56 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }
    
    if (dealsData.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {dealsData.map((deal) => (
            <div key={deal.id} className="w-full">
              <DealCard
                {...deal}
                onClick={() => navigate(`/consumer/store/${deal.partnerId}`)}
              />
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="flex justify-center items-center h-64 bg-neutral-50 rounded-xl">
        <div className="text-center">
          <span className="material-icons text-4xl text-neutral-300">search_off</span>
          <p className="text-neutral-500 mt-2">No deals found</p>
          {selectedCategory && (
            <Button
              variant="link"
              className="text-primary mt-2"
              onClick={() => setSelectedCategory(null)}
            >
              Clear category filter
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // Render stores content
  const renderStoresContent = () => {
    if (isStoresLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }
    
    if (storesData.length > 0) {
      return (
        <div className="space-y-4">
          {storesData.map((store) => (
            <StoreCard
              key={store.id}
              {...store}
              onClick={() => navigate(`/consumer/store/${store.id}`)}
            />
          ))}
        </div>
      );
    }
    
    return (
      <div className="flex justify-center items-center h-64 bg-neutral-50 rounded-xl">
        <div className="text-center">
          <span className="material-icons text-4xl text-neutral-300">store_mall_directory</span>
          <p className="text-neutral-500 mt-2">No stores found</p>
          {selectedCategory && (
            <Button
              variant="link"
              className="text-primary mt-2"
              onClick={() => setSelectedCategory(null)}
            >
              Clear category filter
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="screen pb-20">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/consumer/home")}
            className="mr-2"
          >
            <span className="material-icons text-neutral-700">arrow_back</span>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-800">Explore</h1>
        </div>
        
        <form onSubmit={handleSearch} className="mb-4">
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
        </form>
        
        {/* Categories */}
        <CategoryFilterSelector
          selectedCategory={selectedCategory}
          onChange={setSelectedCategory}
          className="mb-4"
        />
        
        {/* Tabs */}
        <div className="mb-2">
          <Tabs defaultValue="deals" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="stores">Stores</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="p-4">
        {activeTab === "deals" && renderDealsContent()}
        {activeTab === "stores" && renderStoresContent()}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation items={CONSUMER_NAV_ITEMS} />
    </div>
  );
}

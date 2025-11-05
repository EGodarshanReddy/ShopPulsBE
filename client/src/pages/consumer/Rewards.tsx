import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { RewardsCard, RewardHistoryItem } from "@/components/RewardsCard";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { CONSUMER_NAV_ITEMS } from "@/lib/constants";
import { formatDate, formatCurrency, calculateRedemptionValue } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

export default function ConsumerRewards() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState<number>(500);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch user rewards
  const { data: rewardsData, isLoading: isRewardsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CONSUMER_REWARDS],
    enabled: !!user
  });
  
  // Fetch user redemptions
  const { data: redemptionsData, isLoading: isRedemptionsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CONSUMER_REDEMPTIONS],
    enabled: !!user
  });
  
  // Fetch stores for redemption
  const { data: storesData, isLoading: isStoresLoading } = useQuery({
    queryKey: [API_ENDPOINTS.STORES],
    enabled: !!user
  });
  
  const handleRedeemOpen = () => {
    if (rewardsData?.totalPoints < 500) {
      toast({
        title: "Insufficient Points",
        description: "You need at least 500 points to redeem rewards.",
        variant: "destructive"
      });
      return;
    }
    
    setRedeemDialogOpen(true);
  };
  
  const handleRedeem = () => {
    if (!selectedStoreId) {
      toast({
        title: "Store Required",
        description: "Please select a store to redeem at.",
        variant: "destructive"
      });
      return;
    }
    
    if (redeemAmount < 500 || redeemAmount > rewardsData?.totalPoints || redeemAmount > 5000) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid redemption amount between 500 and 5000 points.",
        variant: "destructive"
      });
      return;
    }
    
    // In real implementation, we would call the API to redeem points
    toast({
      title: "Redemption Successful",
      description: `You've redeemed ${redeemAmount} points for ${formatCurrency(calculateRedemptionValue(redeemAmount))}.`
    });
    
    setRedeemDialogOpen(false);
  };
  
  return (
    <div className="screen">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center mb-4">
          <h1 className="text-2xl font-bold text-neutral-800">Rewards</h1>
        </div>
      </div>
      
      <div className="p-4">
        {/* Rewards Card */}
        <RewardsCard
          totalPoints={rewardsData?.totalPoints || 0}
          onRedeem={handleRedeemOpen}
          className="mb-6"
        />
        
        {/* Rewards History */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Rewards History</h2>
          
          {isRewardsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : rewardsData?.rewards && rewardsData.rewards.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {rewardsData.rewards.map((reward) => (
                <RewardHistoryItem
                  key={reward.id}
                  points={reward.points}
                  reason={reward.reason}
                  date={formatDate(reward.createdAt)}
                  isPositive={reward.points > 0}
                />
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-32 bg-neutral-50 rounded-xl">
              <p className="text-neutral-500">No rewards history yet</p>
            </div>
          )}
        </div>
        
        {/* Redemption History */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Redemption History</h2>
          
          {isRedemptionsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : redemptionsData && redemptionsData.length > 0 ? (
            <div className="space-y-4">
              {redemptionsData.map((redemption) => (
                <div
                  key={redemption.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-neutral-800">
                        {redemption.store?.name || "Store"}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {formatDate(redemption.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-800">
                        {formatCurrency(redemption.amount)}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {redemption.points} points
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      redemption.status === 'completed' 
                        ? 'bg-success/10 text-success' 
                        : redemption.status === 'pending'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                    </span>
                    
                    {redemption.status === 'pending' && (
                      <p className="ml-2 text-neutral-600">
                        Show code: <span className="font-medium">{redemption.code}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-32 bg-neutral-50 rounded-xl">
              <p className="text-neutral-500">No redemption history yet</p>
            </div>
          )}
        </div>
        
        {/* How It Works */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">How It Works</h2>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="material-icons text-primary text-sm">store</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-800">Visit Stores</h3>
                  <p className="text-sm text-neutral-600">Get 100 points for each scheduled visit to a partner store</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="material-icons text-primary text-sm">rate_review</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-800">Write Reviews</h3>
                  <p className="text-sm text-neutral-600">Earn 100 points for each review you write after visiting</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="material-icons text-primary text-sm">people</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-800">Refer Friends</h3>
                  <p className="text-sm text-neutral-600">Get 1000 points when a friend joins using your referral</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="material-icons text-primary text-sm">redeem</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-800">Redeem Rewards</h3>
                  <p className="text-sm text-neutral-600">100 points = ₹10. Minimum redemption is 500 points.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Redeem Dialog */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redeem Rewards</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="points">Points to Redeem</Label>
              <Input
                id="points"
                type="number"
                min={500}
                max={Math.min(rewardsData?.totalPoints || 0, 5000)}
                step={100}
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(Number(e.target.value))}
              />
              <p className="text-sm text-neutral-500">
                This will be worth {formatCurrency(calculateRedemptionValue(redeemAmount))}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="store">Select Store</Label>
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger id="store">
                  <SelectValue placeholder="Select a store to redeem at" />
                </SelectTrigger>
                <SelectContent>
                  {isStoresLoading ? (
                    <SelectItem value="loading" disabled>Loading stores...</SelectItem>
                  ) : storesData && storesData.length > 0 ? (
                    storesData.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No stores available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-neutral-600 p-3 bg-neutral-50 rounded-lg">
              <p>
                After redeeming, you'll receive a unique code to show at the store.
                You'll need to upload a proof of purchase (bill/receipt) to complete the redemption.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRedeemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={!selectedStoreId || redeemAmount < 500 || redeemAmount > (rewardsData?.totalPoints || 0) || redeemAmount > 5000}
            >
              Redeem Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bottom Navigation */}
      <BottomNavigation items={CONSUMER_NAV_ITEMS} />
    </div>
  );
}

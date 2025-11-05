import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculatePointsProgress, getPointsForNextReward, calculateRedemptionValue } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RewardsCardProps {
  totalPoints: number;
  onRedeem?: () => void;
  className?: string;
}

export function RewardsCard({ 
  totalPoints, 
  onRedeem,
  className 
}: RewardsCardProps) {
  const progress = calculatePointsProgress(totalPoints);
  const pointsNeeded = getPointsForNextReward(totalPoints);
  const redeemableAmount = calculateRedemptionValue(totalPoints);
  
  return (
    <Card className={cn(
      "bg-gradient-to-r from-accent to-amber-400 p-4 rounded-xl shadow-md",
      className
    )}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white font-bold text-lg">OD! Rewards</h2>
        <span className="text-white font-medium">{totalPoints} points</span>
      </div>
      
      <div className="rewards-progress mb-2">
        <div 
          className="rewards-progress-bar" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <p className="text-white text-sm mb-3">
        {pointsNeeded > 0 
          ? `${pointsNeeded} more points to redeem ₹${calculateRedemptionValue(500)}`
          : `Ready to redeem ₹${redeemableAmount}!`}
      </p>
      
      <Button 
        variant="secondary" 
        className="bg-white text-accent font-medium py-2 px-4 rounded-lg text-sm hover:bg-neutral-100"
        onClick={onRedeem}
        disabled={totalPoints < 500}
      >
        Redeem Points
      </Button>
    </Card>
  );
}

export function PartnerRewardsCard({
  amountDue,
  onViewHistory,
  className
}: {
  amountDue: number;
  onViewHistory?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn(
      "bg-white p-4 rounded-xl shadow-md",
      className
    )}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-neutral-800">OD! Rewards Balance</h2>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-neutral-600 text-sm mb-1">Amount due from platform</p>
          <p className="text-2xl font-bold text-neutral-800">₹{amountDue}</p>
        </div>
        
        <Button 
          variant="secondary" 
          className="bg-accent text-white text-sm py-2 px-4 rounded-lg hover:bg-accent/90"
          onClick={onViewHistory}
        >
          View History
        </Button>
      </div>
    </Card>
  );
}

export function RewardHistoryItem({
  points,
  reason,
  date,
  isPositive = true
}: {
  points: number;
  reason: string;
  date: string;
  isPositive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div className="flex items-center">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mr-3",
          isPositive ? "bg-success/10" : "bg-error/10"
        )}>
          <span className={cn(
            "material-icons",
            isPositive ? "text-success" : "text-error"
          )}>
            {isPositive ? "add_circle" : "remove_circle"}
          </span>
        </div>
        
        <div>
          <p className="font-medium text-neutral-800">{reason}</p>
          <p className="text-xs text-neutral-500">{date}</p>
        </div>
      </div>
      
      <span className={cn(
        "font-semibold",
        isPositive ? "text-success" : "text-error"
      )}>
        {isPositive ? "+" : "-"}{points} pts
      </span>
    </div>
  );
}

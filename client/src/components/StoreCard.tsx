import { Card } from "@/components/ui/card";
import { PriceRating } from "@/components/ui/price-rating";
import { cn } from "@/lib/utils";

export interface StoreCardProps {
  id: number;
  name: string;
  description?: string;
  categories: string[];
  priceRating?: number;
  location?: string;
  distance?: number;
  activeDeals?: number;
  image?: string;
  onClick?: () => void;
}

export function StoreCard({
  name,
  description,
  categories,
  priceRating = 3,
  distance,
  activeDeals = 0,
  image,
  onClick
}: StoreCardProps) {
  return (
    <Card 
      className="store-card flex rounded-xl overflow-hidden bg-white shadow-md mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="w-24 h-24 bg-neutral-100 overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-icons text-4xl text-neutral-300">storefront</span>
          </div>
        )}
      </div>
      
      <div className="p-3 flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-neutral-800">{name}</h3>
          <PriceRating rating={priceRating} size="sm" />
        </div>
        
        <p className="text-xs text-neutral-600 mb-2">
          {description || categories.join(' • ')}
        </p>
        
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            activeDeals > 0 
              ? "bg-neutral-100 text-neutral-700" 
              : "bg-neutral-50 text-neutral-400"
          )}>
            {activeDeals > 0 
              ? `${activeDeals} active deal${activeDeals > 1 ? 's' : ''}` 
              : 'No active deals'}
          </span>
          
          {distance !== undefined && (
            <div className="flex items-center">
              <span className="material-icons text-sm text-accent mr-1">location_on</span>
              <span className="text-xs text-neutral-600">
                {distance < 1 ? `${(distance * 1000).toFixed(0)} m away` : `${distance.toFixed(1)} km away`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function StoreCardCompact({
  name,
  categories,
  priceRating = 3,
  onClick
}: StoreCardProps) {
  return (
    <Card 
      className="flex flex-col rounded-xl overflow-hidden bg-white shadow-md cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="h-32 bg-neutral-100 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <span className="material-icons text-4xl text-neutral-300">storefront</span>
        </div>
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-neutral-800">{name}</h3>
          <PriceRating rating={priceRating} size="sm" />
        </div>
        
        <p className="text-xs text-neutral-600">
          {categories[0] || 'Business'}
        </p>
      </div>
    </Card>
  );
}

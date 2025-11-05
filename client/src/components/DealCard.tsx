import { Card } from "@/components/ui/card";
import { PriceRating } from "@/components/ui/price-rating";
import { calculateTimeLeft } from "@/lib/utils";

export interface DealCardProps {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  dealType: string;
  discountPercentage?: number;
  image?: string;
  partnerId: number;
  partnerName?: string;
  partnerLocation?: string;
  partnerDistance?: number;
  partnerPriceRating?: number;
  onClick?: () => void;
}

export function DealCard({
  name,
  description,
  endDate,
  dealType,
  discountPercentage,
  image,
  partnerName,
  partnerDistance,
  partnerPriceRating,
  onClick
}: DealCardProps) {
  const timeLeft = calculateTimeLeft(endDate);
  
  return (
    <Card 
      className="deal-card flex-shrink-0 w-64 rounded-xl overflow-hidden bg-white shadow-md cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="w-full h-32 overflow-hidden bg-neutral-100">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-icons text-4xl text-neutral-300">
              {dealType === "discount" && "percent"}
              {dealType === "freebie" && "card_giftcard"}
              {dealType === "special" && "local_offer"}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <div className="flex items-center mb-1">
          {discountPercentage && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full mr-2">
              {discountPercentage}% OFF
            </span>
          )}
          {!discountPercentage && dealType === "freebie" && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full mr-2">
              FREE
            </span>
          )}
          {!discountPercentage && dealType === "special" && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full mr-2">
              SPECIAL
            </span>
          )}
          <span className="text-xs text-neutral-500">
            Ends in {timeLeft}
          </span>
        </div>
        
        <h3 className="font-medium text-neutral-800 mb-1">{name}</h3>
        
        {description && (
          <p className="text-xs text-neutral-600 mb-2 line-clamp-2">{description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="material-icons text-sm text-accent mr-1">location_on</span>
            <span className="text-xs text-neutral-600">
              {partnerDistance ? `${partnerDistance} km away` : partnerName}
            </span>
          </div>
          
          {partnerPriceRating && (
            <PriceRating rating={partnerPriceRating} size="sm" />
          )}
        </div>
      </div>
    </Card>
  );
}

export function DealCardHorizontal({
  name,
  description,
  endDate,
  dealType,
  discountPercentage,
  onClick
}: DealCardProps) {
  const timeLeft = calculateTimeLeft(endDate);
  
  return (
    <Card 
      className="mb-4 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="p-4 border-l-4 border-primary">
        <div className="flex items-center mb-1">
          {discountPercentage && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full mr-2">
              {discountPercentage}% OFF
            </span>
          )}
          {!discountPercentage && dealType === "freebie" && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full mr-2">
              FREE
            </span>
          )}
          {!discountPercentage && dealType === "special" && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full mr-2">
              SPECIAL
            </span>
          )}
          <span className="text-xs text-neutral-500">
            Ends in {timeLeft}
          </span>
        </div>
        
        <h3 className="font-medium text-neutral-800 mb-1">{name}</h3>
        
        {description && (
          <p className="text-sm text-neutral-600 mb-3">{description}</p>
        )}
        
        <button 
          className="bg-primary text-white font-medium py-2 px-4 rounded-lg text-sm"
          onClick={onClick}
        >
          Use Deal
        </button>
      </div>
    </Card>
  );
}

export function PartnerDealCard({
  name,
  description,
  endDate,
  isActive = true,
  onEdit,
  onToggle
}: DealCardProps & { 
  isActive?: boolean;
  onEdit?: () => void;
  onToggle?: () => void;
}) {
  const timeLeft = calculateTimeLeft(endDate);
  
  return (
    <Card className="mb-4 bg-white rounded-xl overflow-hidden shadow-md">
      <div className={`p-4 border-l-4 ${isActive ? 'border-success' : 'border-neutral-400'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className={`material-icons mr-1 ${isActive ? 'text-success' : 'text-neutral-500'}`}>
              {isActive ? 'check_circle' : 'pause_circle'}
            </span>
            <span className={`font-medium ${isActive ? 'text-success' : 'text-neutral-500'}`}>
              {isActive ? 'Active' : 'Paused'}
            </span>
          </div>
          <span className="text-xs text-neutral-500">
            {isActive ? `Ends in ${timeLeft}` : 'Paused'}
          </span>
        </div>
        
        <h3 className="font-medium text-neutral-800 mb-1">{name}</h3>
        
        {description && (
          <p className="text-sm text-neutral-600 mb-3">{description}</p>
        )}
        
        <div className="flex">
          <button 
            className="bg-neutral-100 text-neutral-700 text-sm py-2 px-3 rounded-lg mr-2 flex items-center"
            onClick={onEdit}
          >
            <span className="material-icons text-sm mr-1">edit</span>
            <span>Edit</span>
          </button>
          
          <button 
            className="bg-neutral-100 text-neutral-700 text-sm py-2 px-3 rounded-lg flex items-center"
            onClick={onToggle}
          >
            <span className="material-icons text-sm mr-1">
              {isActive ? 'pause' : 'play_arrow'}
            </span>
            <span>{isActive ? 'Pause' : 'Activate'}</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

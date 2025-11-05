import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { PriceRating } from "@/components/ui/price-rating";
import { DealCardHorizontal } from "@/components/DealCard";
import { MapView } from "@/components/ui/map-view";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export default function ConsumerStoreDetail() {
  const { id } = useParams();
  const storeId = Number(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [visitDate, setVisitDate] = useState<Date | undefined>(new Date());
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  
  // Fetch store details
  const { data, isLoading, error } = useQuery({
    queryKey: [API_ENDPOINTS.STORE_DETAIL(storeId)],
    enabled: !isNaN(storeId)
  });
  
  // Handle scheduling a visit
  const scheduleMutation = useMutation({
    mutationFn: (data: { partnerId: number; visitDate: string; dealId?: number }) => {
      return apiRequest("POST", API_ENDPOINTS.CONSUMER_VISITS, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CONSUMER_VISITS] });
      toast({
        title: "Visit Scheduled",
        description: "Your visit has been scheduled successfully."
      });
      setVisitDialogOpen(false);
    },
    onError: (error) => {
      console.error("Failed to schedule visit:", error);
      toast({
        title: "Failed to Schedule Visit",
        description: "There was an error scheduling your visit. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleScheduleVisit = (dealId?: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to schedule a visit.",
        variant: "destructive"
      });
      navigate("/consumer/login");
      return;
    }
    
    if (dealId) {
      setSelectedDealId(dealId);
    } else {
      setSelectedDealId(null);
    }
    
    setVisitDialogOpen(true);
  };
  
  const handleConfirmVisit = () => {
    if (!visitDate) {
      toast({
        title: "Date Required",
        description: "Please select a date for your visit.",
        variant: "destructive"
      });
      return;
    }
    
    const visitData = {
      partnerId: storeId,
      visitDate: visitDate.toISOString(),
      ...(selectedDealId && { dealId: selectedDealId })
    };
    
    scheduleMutation.mutate(visitData);
  };
  
  if (isLoading) {
    return (
      <div className="screen p-4 flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons text-4xl text-neutral-300 animate-spin">refresh</span>
          <p className="mt-2 text-neutral-500">Loading store details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="screen p-4 flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons text-4xl text-error">error_outline</span>
          <p className="mt-2 text-neutral-500">Failed to load store details</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/consumer/home")}
          >
            Go Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  const { store, deals, reviews } = data;
  
  return (
    <div className="screen">
      <div className="relative">
        <div className="h-56 bg-neutral-100">
          {store.images && store.images.length > 0 ? (
            <img
              src={store.images[0]}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-icons text-6xl text-neutral-300">storefront</span>
            </div>
          )}
        </div>
        
        <Button
          variant="secondary"
          size="icon"
          onClick={() => navigate("/consumer/home")}
          className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-md"
        >
          <span className="material-icons text-neutral-700">arrow_back</span>
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md"
        >
          <span className="material-icons text-neutral-700">share</span>
        </Button>
      </div>
      
      <div className="p-4 bg-white -mt-6 rounded-t-3xl relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-1">{store.name}</h1>
            <p className="text-neutral-600 text-sm">
              {store.categories?.join(' • ') || 'Business'}
            </p>
          </div>
          
          <PriceRating rating={store.priceRating || 3} />
        </div>
        
        <div className="flex mb-4">
          <div className="flex items-center mr-4">
            <span className="material-icons text-sm text-neutral-700 mr-1">star</span>
            <span className="text-sm text-neutral-700">
              {reviews && reviews.length > 0
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                : "New"}
            </span>
            <span className="text-xs text-neutral-500 ml-1">
              ({reviews ? reviews.length : 0})
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="material-icons text-sm text-neutral-700 mr-1">location_on</span>
            <span className="text-sm text-neutral-700">{store.location}</span>
          </div>
        </div>
        
        <div className="flex border-b border-neutral-200 pb-4 mb-4">
          <Button
            variant="secondary"
            className="flex-1 flex flex-col items-center justify-center mr-2 bg-neutral-100 text-neutral-700 rounded-xl py-3 hover:bg-neutral-200"
          >
            <span className="material-icons mb-1">call</span>
            <span className="text-sm">Call</span>
          </Button>
          
          <Button
            variant="secondary"
            className="flex-1 flex flex-col items-center justify-center mr-2 bg-neutral-100 text-neutral-700 rounded-xl py-3 hover:bg-neutral-200"
            onClick={() => window.open(`https://maps.google.com/?q=${store.latitude},${store.longitude}`, '_blank')}
          >
            <span className="material-icons mb-1">directions</span>
            <span className="text-sm">Directions</span>
          </Button>
          
          <Button
            variant="secondary"
            className="flex-1 flex flex-col items-center justify-center bg-neutral-100 text-neutral-700 rounded-xl py-3 hover:bg-neutral-200"
            onClick={() => handleScheduleVisit()}
          >
            <span className="material-icons mb-1">schedule</span>
            <span className="text-sm">Schedule</span>
          </Button>
        </div>
        
        {/* Active Deals */}
        {deals && deals.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-neutral-800">Active Deals</h2>
              <span className="text-sm text-neutral-500">{deals.length} deals</span>
            </div>
            
            {deals.map((deal) => (
              <DealCardHorizontal
                key={deal.id}
                {...deal}
                onClick={() => handleScheduleVisit(deal.id)}
              />
            ))}
          </div>
        )}
        
        {/* About */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">About</h2>
          <p className="text-neutral-600 mb-3">{store.description || 'No description available.'}</p>
          
          {store.businessHours && (
            <div className="mb-3">
              <h3 className="font-medium text-neutral-700 mb-1">Business Hours</h3>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Monday - Thursday</span>
                <span>11:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Friday - Sunday</span>
                <span>11:00 AM - 11:00 PM</span>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-neutral-700 mb-1">Contact</h3>
            <p className="text-sm text-neutral-600">{store.contactPhone}</p>
          </div>
        </div>
        
        {/* Location */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Location</h2>
          <MapView
            location={{
              latitude: store.latitude || 0,
              longitude: store.longitude || 0,
              name: store.name
            }}
            height="200px"
          />
          <p className="text-sm text-neutral-600 mt-2">{store.location}</p>
        </div>
        
        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-neutral-800">Reviews</h2>
              <Button variant="link" className="text-secondary text-sm font-medium p-0">
                View All
              </Button>
            </div>
            
            {reviews.slice(0, 2).map((review) => (
              <div key={review.id} className="mb-4">
                <div className="flex items-start mb-2">
                  <div className="bg-neutral-200 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <span className="material-icons text-neutral-500">person</span>
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <h3 className="font-medium text-neutral-800 mr-2">
                        {review.userId}
                      </h3>
                      <span className="text-xs text-neutral-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`material-icons text-xs ${
                            i < review.rating ? "text-accent" : "text-neutral-300"
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-neutral-600">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex">
          <Button
            className="w-full bg-primary text-white font-semibold py-4 px-6 rounded-xl"
            onClick={() => handleScheduleVisit()}
          >
            Schedule a Visit
          </Button>
        </div>
      </div>
      
      {/* Schedule Visit Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule a Visit</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Select Date</Label>
              <Calendar
                mode="single"
                selected={visitDate}
                onSelect={setVisitDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            
            {selectedDealId && (
              <div className="text-sm text-neutral-700 p-3 bg-neutral-50 rounded-lg">
                <p>
                  You're scheduling a visit for the deal: 
                  <strong>
                    {deals.find(d => d.id === selectedDealId)?.name}
                  </strong>
                </p>
              </div>
            )}
            
            {visitDate && (
              <p className="text-sm text-neutral-600">
                You're planning to visit on{" "}
                <strong>{format(visitDate, "EEEE, MMMM do, yyyy")}</strong>
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVisitDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmVisit}
              disabled={!visitDate || scheduleMutation.isPending}
            >
              {scheduleMutation.isPending ? "Scheduling..." : "Confirm Visit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

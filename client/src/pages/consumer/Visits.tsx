import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/star-rating";

interface Visit {
  id: number;
  userId: number;
  partnerId: number;
  visitDate: string;
  notes?: string;
  dealId?: number;
  status: string;
  markedAsVisited: boolean;
  createdAt: string;
  store?: {
    id: number;
    name: string;
    categories: string[];
    location: string;
  };
  deal?: {
    id: number;
    name: string;
    dealType: string;
    discountPercentage?: number;
  };
}

export default function ConsumerVisits() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Fetch user visits
  const { data: visits, isLoading } = useQuery({
    queryKey: ['/api/consumer/visits'],
    enabled: true
  });

  // Mark visit as completed mutation
  const markVisitCompletedMutation = useMutation({
    mutationFn: async (visitId: number) => {
      const response = await apiRequest("POST", `/api/consumer/visits/${visitId}/complete`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Visit Completed",
        description: "You've earned 100 reward points for visiting the store!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/consumer/visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/consumer/rewards'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark visit as completed",
        variant: "destructive"
      });
    }
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { partnerId: number; rating: number; comment?: string }) => {
      const response = await apiRequest("POST", API_ENDPOINTS.CONSUMER_REVIEWS, reviewData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback! You've earned 100 reward points."
      });
      setReviewDialogOpen(false);
      setSelectedVisit(null);
      setRating(5);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/consumer/rewards'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    }
  });

  const handleMarkCompleted = (visitId: number) => {
    markVisitCompletedMutation.mutate(visitId);
  };

  const handleWriteReview = (visit: Visit) => {
    setSelectedVisit(visit);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedVisit) return;
    
    submitReviewMutation.mutate({
      partnerId: selectedVisit.partnerId,
      rating,
      comment: comment.trim() || undefined
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col p-6 bg-white">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/consumer/home")}
            className="mr-4"
          >
            <span className="material-icons text-neutral-700">arrow_back</span>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-800">My Visits</h1>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="h-32 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-6 bg-white">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/consumer/home")}
          className="mr-4"
        >
          <span className="material-icons text-neutral-700">arrow_back</span>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-800">My Visits</h1>
      </div>

      {!visits || visits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="material-icons text-6xl text-neutral-300 mb-4">event_note</span>
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">No visits yet</h2>
          <p className="text-neutral-500 mb-6">Schedule visits to stores to start earning rewards!</p>
          <Button 
            onClick={() => navigate("/consumer/explore")}
            className="bg-primary text-white"
          >
            Explore Stores
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4">
          {visits.map((visit: Visit) => (
            <Card key={visit.id} className="p-4 border border-neutral-200 rounded-xl">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-800">{visit.store?.name}</h3>
                  <p className="text-sm text-neutral-600">{visit.store?.location}</p>
                  <p className="text-sm text-neutral-500">Scheduled: {formatDate(visit.visitDate)}</p>
                </div>
                <Badge 
                  variant={visit.markedAsVisited ? "default" : "secondary"}
                  className={visit.markedAsVisited ? "bg-green-100 text-green-800" : ""}
                >
                  {visit.markedAsVisited ? "Completed" : "Scheduled"}
                </Badge>
              </div>

              {visit.deal && (
                <div className="bg-neutral-50 p-3 rounded-lg mb-3">
                  <p className="text-sm font-medium text-neutral-700">{visit.deal.name}</p>
                  <p className="text-xs text-neutral-600">
                    {visit.deal.dealType === 'discount' && visit.deal.discountPercentage && 
                      `${visit.deal.discountPercentage}% off`}
                  </p>
                </div>
              )}

              {visit.notes && (
                <div className="mb-3">
                  <p className="text-sm text-neutral-600">{visit.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!visit.markedAsVisited && (
                  <Button
                    size="sm"
                    onClick={() => handleMarkCompleted(visit.id)}
                    disabled={markVisitCompletedMutation.isPending}
                    className="bg-primary text-white"
                  >
                    {markVisitCompletedMutation.isPending ? "Marking..." : "Mark as Visited"}
                  </Button>
                )}
                
                {visit.markedAsVisited && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWriteReview(visit)}
                    className="border-primary text-primary"
                  >
                    Write Review
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-neutral-800">{selectedVisit.store?.name}</h4>
                <p className="text-sm text-neutral-600">{selectedVisit.store?.location}</p>
              </div>

              <div>
                <Label className="block text-neutral-700 font-medium mb-2">Rating</Label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <div>
                <Label className="block text-neutral-700 font-medium mb-2">Comment (Optional)</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitReviewMutation.isPending}
                  className="flex-1 bg-primary text-white"
                >
                  {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
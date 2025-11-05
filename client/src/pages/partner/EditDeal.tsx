import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS, DEAL_TYPES, BUSINESS_CATEGORIES } from "@/lib/constants";
import { ImageUploader } from "@/components/ImageUploader";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  category: z.string().min(1, "Category is required"),
  dealType: z.string().min(1, "Deal type is required"),
  discountPercentage: z.number().optional(),
  images: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof dealSchema>;

export default function EditDeal() {
  const { id } = useParams();
  const dealId = Number(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [dealImages, setDealImages] = useState<string[]>([]);
  const [selectedDealType, setSelectedDealType] = useState<string>("discount");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    } else if (!isAuthLoading && user && user.userType !== "partner") {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);
  
  // Fetch deal data
  const { data: dealData, isLoading: isDealLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PARTNER_DEAL(dealId)],
    enabled: !!user && !isNaN(dealId)
  });
  
  // Define a minimum start date (today)
  const today = new Date();
  const minStartDate = today.toISOString().split('T')[0];
  
  // Calculate a minimum end date (start date + 1 day)
  const calculateMinEndDate = (startDate: string) => {
    if (!startDate) return minStartDate;
    
    const date = new Date(startDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: minStartDate,
      endDate: calculateMinEndDate(minStartDate),
      category: "",
      dealType: "discount",
      discountPercentage: 0,
      images: [],
    }
  });
  
  // Update form with deal data when it loads
  useEffect(() => {
    if (dealData) {
      // Format dates for the date input (YYYY-MM-DD)
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      form.reset({
        name: dealData.name,
        description: dealData.description || "",
        startDate: formatDate(dealData.startDate),
        endDate: formatDate(dealData.endDate),
        category: dealData.category,
        dealType: dealData.dealType,
        discountPercentage: dealData.discountPercentage || 0,
        images: dealData.images || [],
      });
      
      setSelectedDealType(dealData.dealType);
      setDealImages(dealData.images || []);
    }
  }, [dealData, form]);
  
  // Update end date minimum when start date changes
  useEffect(() => {
    const startDate = form.watch("startDate");
    if (startDate) {
      const currentEndDate = form.watch("endDate");
      const minEnd = calculateMinEndDate(startDate);
      
      // If current end date is before the new minimum, update it
      if (!currentEndDate || new Date(currentEndDate) < new Date(minEnd)) {
        form.setValue("endDate", minEnd);
      }
    }
  }, [form.watch("startDate")]);
  
  const handleImageChange = (images: string[]) => {
    setDealImages(images);
    form.setValue("images", images);
  };
  
  const handleDealTypeSelect = (type: string) => {
    setSelectedDealType(type);
    form.setValue("dealType", type);
  };
  
  const onSubmit = async (values: FormValues) => {
    try {
      await apiRequest("PATCH", API_ENDPOINTS.PARTNER_DEAL(dealId), values);
      
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PARTNER_DEALS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PARTNER_DEAL(dealId)] });
      
      toast({
        title: "Deal Updated",
        description: "Your deal has been updated successfully."
      });
      
      navigate("/partner/home");
    } catch (error) {
      console.error("Failed to update deal:", error);
      toast({
        title: "Failed to Update Deal",
        description: "There was an error updating your deal. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async () => {
    try {
      await apiRequest("POST", API_ENDPOINTS.PARTNER_DEAL_DEACTIVATE(dealId), {});
      
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PARTNER_DEALS] });
      
      toast({
        title: "Deal Deleted",
        description: "Your deal has been removed successfully."
      });
      
      navigate("/partner/home");
    } catch (error) {
      console.error("Failed to delete deal:", error);
      toast({
        title: "Failed to Delete Deal",
        description: "There was an error deleting your deal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConfirmDeleteOpen(false);
    }
  };
  
  if (isDealLoading) {
    return (
      <div className="screen bg-white p-4">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/partner/home")}
            className="mr-4"
          >
            <span className="material-icons text-neutral-700">arrow_back</span>
          </Button>
          <Skeleton className="h-8 w-40" />
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  if (!dealData) {
    return (
      <div className="screen bg-white p-4 flex flex-col items-center justify-center">
        <span className="material-icons text-4xl text-neutral-400 mb-4">error_outline</span>
        <h2 className="text-xl font-bold text-neutral-800 mb-2">Deal Not Found</h2>
        <p className="text-neutral-600 mb-6 text-center">
          The deal you're trying to edit doesn't exist or you don't have permission to edit it.
        </p>
        <Button onClick={() => navigate("/partner/home")}>
          Go Back to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="screen bg-white">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/partner/home")}
            className="mr-4"
          >
            <span className="material-icons text-neutral-700">arrow_back</span>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-800">Edit Deal</h1>
        </div>
      </div>
      
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="deal-name" className="block text-neutral-700 font-medium mb-2">
                    Deal Name
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      id="deal-name"
                      placeholder="e.g. Weekend Special Buffet"
                      className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="deal-description" className="block text-neutral-700 font-medium mb-2">
                    Description
                  </Label>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="deal-description"
                      rows={3}
                      placeholder="Describe your deal..."
                      className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="start-date" className="block text-neutral-700 font-medium mb-2">
                      Start Date
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="start-date"
                        type="date"
                        className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="end-date" className="block text-neutral-700 font-medium mb-2">
                      End Date
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="end-date"
                        type="date"
                        min={calculateMinEndDate(form.watch("startDate") || minStartDate)}
                        className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="deal-category" className="block text-neutral-700 font-medium mb-2">
                    Category
                  </Label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger id="deal-category" className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary h-auto">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dealType"
              render={({ field }) => (
                <FormItem>
                  <Label className="block text-neutral-700 font-medium mb-2">Deal Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {DEAL_TYPES.map((type) => (
                      <Card
                        key={type.id}
                        className={`cursor-pointer border-2 rounded-xl p-3 text-center hover:border-primary hover:bg-primary/5 transition-colors ${
                          selectedDealType === type.id
                            ? "border-primary bg-primary/5"
                            : "border-neutral-300"
                        }`}
                        onClick={() => handleDealTypeSelect(type.id)}
                      >
                        <span className="material-icons mb-1 text-neutral-600">
                          {type.icon}
                        </span>
                        <span className="text-sm text-neutral-700">{type.label}</span>
                      </Card>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedDealType === "discount" && (
              <FormField
                control={form.control}
                name="discountPercentage"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="discount-percentage" className="block text-neutral-700 font-medium mb-2">
                      Discount Percentage
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="discount-percentage"
                        type="number"
                        min={1}
                        max={99}
                        placeholder="25"
                        className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <Label className="block text-neutral-700 font-medium mb-2">
                    Deal Images (Max 3)
                  </Label>
                  <FormControl>
                    <ImageUploader
                      maxImages={3}
                      images={dealImages}
                      onChange={handleImageChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col space-y-3">
              <Button
                type="submit"
                className="w-full bg-primary text-white font-semibold py-4 px-6 rounded-xl"
              >
                Save Changes
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-error text-error font-semibold py-4 px-6 rounded-xl"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Delete Deal
              </Button>
            </div>
          </form>
        </Form>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            
            <p className="py-4">
              Are you sure you want to delete this deal? This action cannot be undone.
            </p>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Delete Deal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

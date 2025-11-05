import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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

export default function AddDeal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [dealImages, setDealImages] = useState<string[]>([]);
  const [selectedDealType, setSelectedDealType] = useState<string>("discount");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    } else if (!isAuthLoading && user && user.userType !== "partner") {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);
  
  // Fetch store data
  const { data: storeData, isLoading: isStoreLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PARTNER_STORE],
    enabled: !!user
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
      await apiRequest("POST", API_ENDPOINTS.PARTNER_DEALS, values);
      
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PARTNER_DEALS] });
      
      toast({
        title: "Deal Created",
        description: "Your deal has been created successfully."
      });
      
      navigate("/partner/home");
    } catch (error) {
      console.error("Failed to create deal:", error);
      toast({
        title: "Failed to Create Deal",
        description: "There was an error creating your deal. Please try again.",
        variant: "destructive"
      });
    }
  };
  
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
          <h1 className="text-2xl font-bold text-neutral-800">Add New Deal</h1>
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
                        min={minStartDate}
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
            
            <div className="flex">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-2 border-primary text-primary font-semibold py-4 px-6 rounded-xl mr-3"
                onClick={() => navigate("/partner/home")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-white font-semibold py-4 px-6 rounded-xl"
              >
                Publish Deal
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

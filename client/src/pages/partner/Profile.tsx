import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS, PARTNER_NAV_ITEMS, DEFAULT_BUSINESS_HOURS } from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PriceRating } from "@/components/ui/price-rating";
import { ImageUploader } from "@/components/ImageUploader";
import { CategorySelector } from "@/components/CategorySelector";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  contactPhone: z.string()
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number can't be longer than 15 digits")
    .regex(/^\d+$/, "Contact number must contain only digits"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  categories: z.array(z.string()).min(1, "Please select at least one category"),
  priceRating: z.number().min(1).max(5).default(3),
  upiId: z.string().optional(),
  images: z.array(z.string()).optional(),
  servicesOffered: z.array(z.string()).optional(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

export default function PartnerProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [storeImages, setStoreImages] = useState<string[]>([]);
  const [priceRatingValue, setPriceRatingValue] = useState<number>(3);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [currentService, setCurrentService] = useState<string>("");
  
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
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: StoreFormValues) => {
      return apiRequest("PATCH", API_ENDPOINTS.PARTNER_STORE, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PARTNER_STORE] });
      toast({
        title: "Profile Updated",
        description: "Your business profile has been updated successfully."
      });
      setEditProfileOpen(false);
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const storeForm = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      contactPhone: "",
      description: "",
      location: "",
      latitude: "",
      longitude: "",
      categories: [],
      priceRating: 3,
      upiId: "",
      images: [],
      servicesOffered: [],
    }
  });
  
  // Update form with store data when it loads
  useEffect(() => {
    if (storeData) {
      storeForm.reset({
        name: storeData.name,
        contactPhone: storeData.contactPhone,
        description: storeData.description || "",
        location: storeData.location,
        latitude: storeData.latitude || "",
        longitude: storeData.longitude || "",
        categories: storeData.categories || [],
        priceRating: storeData.priceRating || 3,
        upiId: storeData.upiId || "",
        images: storeData.images || [],
        servicesOffered: storeData.servicesOffered || [],
      });
      
      setPriceRatingValue(storeData.priceRating || 3);
      setStoreImages(storeData.images || []);
      setServicesOffered(storeData.servicesOffered || []);
    }
  }, [storeData, storeForm]);
  
  const addService = () => {
    if (currentService.trim()) {
      const updatedServices = [...servicesOffered, currentService.trim()];
      setServicesOffered(updatedServices);
      storeForm.setValue("servicesOffered", updatedServices);
      setCurrentService("");
    }
  };
  
  const removeService = (index: number) => {
    const updatedServices = servicesOffered.filter((_, i) => i !== index);
    setServicesOffered(updatedServices);
    storeForm.setValue("servicesOffered", updatedServices);
  };
  
  const handleImageChange = (images: string[]) => {
    setStoreImages(images);
    storeForm.setValue("images", images);
  };
  
  const handlePriceRatingChange = (rating: number) => {
    setPriceRatingValue(rating);
    storeForm.setValue("priceRating", rating);
  };
  
  const handleUpdateProfile = (values: StoreFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/welcome");
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully."
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConfirmLogoutOpen(false);
    }
  };
  
  return (
    <div className="screen">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center mb-4">
          <h1 className="text-2xl font-bold text-neutral-800">Business Profile</h1>
        </div>
      </div>
      
      <div className="p-4">
        {/* Profile Card */}
        {isStoreLoading ? (
          <Skeleton className="h-40 w-full mb-6" />
        ) : (
          <Card className="bg-white rounded-xl shadow-md overflow-hidden p-4 mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mr-4">
                <span className="material-icons text-white text-2xl">store</span>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-neutral-800">
                  {storeData?.name || "Your Business"}
                </h2>
                <div className="flex items-center space-x-2">
                  <PriceRating rating={storeData?.priceRating || 3} size="sm" />
                  <span className="text-sm text-neutral-600">• {storeData?.categories?.[0]}</span>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEditProfileOpen(true)}
            >
              Edit Business Profile
            </Button>
          </Card>
        )}
        
        {/* Business Details */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-4 mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Business Details</h2>
          
          {isStoreLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-neutral-700">Contact</h3>
                <p className="text-neutral-800">{storeData?.contactPhone}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-700">Description</h3>
                <p className="text-neutral-800">{storeData?.description || "No description available"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-700">Location</h3>
                <p className="text-neutral-800">{storeData?.location}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-700">Categories</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {storeData?.categories?.map((category, index) => (
                    <div key={index} className="bg-neutral-100 px-3 py-1 rounded-full text-sm">
                      {category}
                    </div>
                  ))}
                </div>
              </div>
              
              {storeData?.servicesOffered && storeData.servicesOffered.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700">Services/Items Offered</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {storeData.servicesOffered.map((service, index) => (
                      <div key={index} className="bg-neutral-100 px-3 py-1 rounded-full text-sm">
                        {service}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Actions</h2>
          
          <Button
            variant="outline"
            className="w-full flex justify-between items-center py-3 px-4"
            onClick={() => navigate("/partner/deals")}
          >
            <div className="flex items-center">
              <span className="material-icons text-primary mr-3">local_offer</span>
              <span>Manage Deals</span>
            </div>
            <span className="material-icons">chevron_right</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex justify-between items-center py-3 px-4"
            onClick={() => navigate("/partner/analytics")}
          >
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">analytics</span>
              <span>View Analytics</span>
            </div>
            <span className="material-icons">chevron_right</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex justify-between items-center py-3 px-4"
            onClick={() => navigate("/partner/visits")}
          >
            <div className="flex items-center">
              <span className="material-icons text-accent mr-3">event</span>
              <span>Scheduled Visits</span>
            </div>
            <span className="material-icons">chevron_right</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex justify-between items-center py-3 px-4"
          >
            <div className="flex items-center">
              <span className="material-icons text-neutral-700 mr-3">help_outline</span>
              <span>Help & Support</span>
            </div>
            <span className="material-icons">chevron_right</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex justify-between items-center py-3 px-4"
          >
            <div className="flex items-center">
              <span className="material-icons text-neutral-700 mr-3">privacy_tip</span>
              <span>Privacy Policy</span>
            </div>
            <span className="material-icons">chevron_right</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex justify-between items-center py-3 px-4"
            onClick={() => setConfirmLogoutOpen(true)}
          >
            <div className="flex items-center">
              <span className="material-icons text-error mr-3">logout</span>
              <span className="text-error">Logout</span>
            </div>
          </Button>
        </div>
        
        {/* App Info */}
        <div className="text-center text-neutral-500 text-sm mb-6">
          <p>ODeals Business</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
      
      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-[90%] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business Profile</DialogTitle>
          </DialogHeader>
          
          <Form {...storeForm}>
            <form onSubmit={storeForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
              <FormField
                control={storeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="store-name">Business Name</Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="store-name"
                        placeholder="E.g., Spice Garden Restaurant"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={storeForm.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="contact-phone">Business Contact Number</Label>
                    <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="text-neutral-500 ml-3 mr-1">+91</span>
                      <FormControl>
                        <Input
                          {...field}
                          id="contact-phone"
                          type="tel"
                          placeholder="9876543210"
                          maxLength={10}
                          className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </FormControl>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Preferably a number with WhatsApp
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={storeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="description">Business Description</Label>
                    <FormControl>
                      <Textarea
                        {...field}
                        id="description"
                        placeholder="Tell customers about your business..."
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={storeForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="location">Location</Label>
                    <FormControl>
                      <Textarea
                        {...field}
                        id="location"
                        placeholder="Full address of your business"
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={storeForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="latitude">Latitude (optional)</Label>
                      <FormControl>
                        <Input
                          {...field}
                          id="latitude"
                          placeholder="E.g., 12.9716"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={storeForm.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="longitude">Longitude (optional)</Label>
                      <FormControl>
                        <Input
                          {...field}
                          id="longitude"
                          placeholder="E.g., 77.5946"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={storeForm.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <Label>Business Categories</Label>
                    <FormControl>
                      <CategorySelector
                        selectedCategories={field.value}
                        onChange={field.onChange}
                        multiSelect
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label>Business Classification</Label>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600 mb-2">
                    How would you rate your business pricing? (Economy to Luxury)
                  </p>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handlePriceRatingChange(rating)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          rating <= priceRatingValue ? 'bg-accent text-white' : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        ₹
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 px-1">
                    <span>Economy</span>
                    <span>Luxury</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="upi-id">UPI ID (optional)</Label>
                <Input
                  id="upi-id"
                  placeholder="yourname@bank"
                  value={storeForm.watch("upiId") || ""}
                  onChange={(e) => storeForm.setValue("upiId", e.target.value)}
                />
                <p className="text-xs text-neutral-500">
                  To receive OD! Rewards amount redeemed by customers
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Services/Items Offered</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a service or item"
                    value={currentService}
                    onChange={(e) => setCurrentService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addService();
                      }
                    }}
                  />
                  <Button type="button" onClick={addService}>Add</Button>
                </div>
                {servicesOffered.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {servicesOffered.map((service, index) => (
                      <div key={index} className="bg-neutral-100 px-3 py-1 rounded-full flex items-center">
                        <span className="text-sm">{service}</span>
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="ml-2 text-neutral-500 hover:text-red-500"
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Business Images (Max 10)</Label>
                <ImageUploader
                  maxImages={10}
                  images={storeImages}
                  onChange={handleImageChange}
                />
                <p className="text-xs text-neutral-500">
                  Upload images of your store, products, or services
                </p>
              </div>
              
              <Separator />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditProfileOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Logout Confirmation Dialog */}
      <Dialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          
          <p className="py-4">Are you sure you want to logout of your account?</p>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLogoutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bottom Navigation */}
      <BottomNavigation items={PARTNER_NAV_ITEMS} />
    </div>
  );
}

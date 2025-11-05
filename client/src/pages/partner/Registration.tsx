import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS, DEFAULT_BUSINESS_HOURS } from "@/lib/constants";
import { CategorySelector } from "@/components/CategorySelector";
import { ImageUploader } from "@/components/ImageUploader";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { PriceRating } from "@/components/ui/price-rating";
import { Separator } from "@/components/ui/separator";

const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

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

type UserFormValues = z.infer<typeof userSchema>;
type StoreFormValues = z.infer<typeof storeSchema>;

export default function PartnerRegistration() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [storeImages, setStoreImages] = useState<string[]>([]);
  const [priceRatingValue, setPriceRatingValue] = useState<number>(3);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [currentService, setCurrentService] = useState<string>("");
  
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
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
  
  useEffect(() => {
    const phone = sessionStorage.getItem("phoneForVerification");
    if (!phone) {
      navigate("/partner/login");
      return;
    }
    
    setPhoneNumber(phone);
    // Set the contact phone default to the verified phone
    storeForm.setValue("contactPhone", phone);
  }, [navigate, storeForm]);
  
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
  
  const onSubmit = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Phone number not found. Please go back and try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate both forms manually
    const userValid = await userForm.trigger();
    const storeValid = await storeForm.trigger();
    
    if (!userValid || !storeValid) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const userData = userForm.getValues();
      const storeData = storeForm.getValues();
      
      // Add business hours (using default for now)
      const businessHours = DEFAULT_BUSINESS_HOURS;
      
      // Prepare registration data
      const registrationData = {
        userData: {
          ...userData,
          phone: phoneNumber,
        },
        storeData: {
          ...storeData,
          businessHours,
        }
      };
      
      const response = await apiRequest("POST", API_ENDPOINTS.REGISTER_PARTNER, registrationData);
      
      const data = await response.json();
      
      // Login and navigate to home
      await login({
        userId: data.userId,
        userType: "partner"
      });
      
      // Clear storage and navigate to home
      sessionStorage.removeItem("phoneForVerification");
      navigate("/partner/home");
      
      toast({
        title: "Registration Successful",
        description: "Your business account has been created successfully."
      });
      
    } catch (error) {
      console.error("Failed to register:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePriceRatingChange = (rating: number) => {
    setPriceRatingValue(rating);
    storeForm.setValue("priceRating", rating);
  };
  
  return (
    <div className="screen p-6 bg-white overflow-y-auto">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/partner/verify-otp")}
          className="mr-4"
        >
          <span className="material-icons text-neutral-700">arrow_back</span>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-800">Register Business</h1>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-bold text-neutral-800 mb-4">Business Owner Information</h2>
        
        <Form {...userForm}>
          <form className="space-y-4">
            <FormField
              control={userForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="first-name" className="block text-neutral-700 font-medium mb-2">
                    First Name
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      id="first-name"
                      placeholder="John"
                      className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={userForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="last-name" className="block text-neutral-700 font-medium mb-2">
                    Last Name
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      id="last-name"
                      placeholder="Doe"
                      className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={userForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email" className="block text-neutral-700 font-medium mb-2">
                    Email
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Label className="block text-neutral-700 font-medium mb-2">
                Primary Contact Number
              </Label>
              <div className="flex items-center border-2 border-neutral-300 rounded-xl p-3 bg-neutral-50">
                <span className="text-neutral-500 mr-2">+91</span>
                <span className="text-neutral-800">{phoneNumber}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                This is the verified number you used during registration
              </p>
            </div>
          </form>
        </Form>
      </div>

      <Separator className="my-6" />
      
      <div className="mb-6">
        <h2 className="text-lg font-bold text-neutral-800 mb-4">Business Information</h2>
        
        <Form {...storeForm}>
          <form className="space-y-4">
            <FormField
              control={storeForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="store-name" className="block text-neutral-700 font-medium mb-2">
                    Business Name
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      id="store-name"
                      placeholder="E.g., Spice Garden Restaurant"
                      className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
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
                  <Label htmlFor="contact-phone" className="block text-neutral-700 font-medium mb-2">
                    Business Contact Number (Customer-facing)
                  </Label>
                  <div className="flex items-center border-2 border-neutral-300 rounded-xl p-3 focus-within:border-primary">
                    <span className="text-neutral-500 mr-2">+91</span>
                    <FormControl>
                      <Input
                        {...field}
                        id="contact-phone"
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
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
                  <Label htmlFor="description" className="block text-neutral-700 font-medium mb-2">
                    Business Description
                  </Label>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="description"
                      placeholder="Tell customers about your business..."
                      className="min-h-[120px] w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
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
                  <Label htmlFor="location" className="block text-neutral-700 font-medium mb-2">
                    Location
                  </Label>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="location"
                      placeholder="Full address of your business"
                      className="min-h-[80px] w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
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
                    <Label htmlFor="latitude" className="block text-neutral-700 font-medium mb-2">
                      Latitude (optional)
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="latitude"
                        placeholder="E.g., 12.9716"
                        className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
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
                    <Label htmlFor="longitude" className="block text-neutral-700 font-medium mb-2">
                      Longitude (optional)
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="longitude"
                        placeholder="E.g., 77.5946"
                        className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
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
                  <Label className="block text-neutral-700 font-medium mb-2">
                    Business Categories
                  </Label>
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
              <Label className="block text-neutral-700 font-medium mb-2">
                Business Classification
              </Label>
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
              <Label htmlFor="upi-id" className="block text-neutral-700 font-medium mb-2">
                UPI ID (optional)
              </Label>
              <Input
                id="upi-id"
                placeholder="yourname@bank"
                value={storeForm.watch("upiId") || ""}
                onChange={(e) => storeForm.setValue("upiId", e.target.value)}
                className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
              />
              <p className="text-xs text-neutral-500">
                To receive OD! Rewards amount redeemed by customers
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="block text-neutral-700 font-medium mb-2">
                Services/Items Offered
              </Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a service or item"
                  value={currentService}
                  onChange={(e) => setCurrentService(e.target.value)}
                  className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
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
              <Label className="block text-neutral-700 font-medium mb-2">
                Business Images (Max 10)
              </Label>
              <ImageUploader
                maxImages={10}
                images={storeImages}
                onChange={handleImageChange}
              />
              <p className="text-xs text-neutral-500">
                Upload images of your store, products, or services
              </p>
            </div>
          </form>
        </Form>
      </div>
      
      <Button 
        onClick={onSubmit}
        className="w-full bg-primary text-white font-semibold py-4 px-6 rounded-xl mt-6"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Registering..." : "Complete Registration"}
      </Button>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { CategorySelector } from "@/components/CategorySelector";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters").max(6, "ZIP code can't be longer than 6 characters"),
  favoriteCategories: z.array(z.string()).min(1, "Please select at least one category")
});

type FormValues = z.infer<typeof registrationSchema>;

export default function ConsumerRegistration() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      zipCode: "",
      favoriteCategories: []
    }
  });
  
  useEffect(() => {
    const phone = sessionStorage.getItem("phoneForVerification");
    if (!phone) {
      navigate("/consumer/login");
      return;
    }
    
    setPhoneNumber(phone);
  }, [navigate]);
  
  const onSubmit = async (values: FormValues) => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Phone number not found. Please go back and try again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", API_ENDPOINTS.REGISTER_CONSUMER, {
        ...values,
        phone: phoneNumber,
        userType: "consumer"
      });
      
      const data = await response.json();
      
      // Login and navigate to home
      await login({
        userId: data.userId,
        userType: "consumer"
      });
      
      // Clear storage and navigate to home
      sessionStorage.removeItem("phoneForVerification");
      navigate("/consumer/home");
      
      toast({
        title: "Registration Successful",
        description: "Welcome to ODeals! Your account has been created successfully."
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
  
  return (
    <div className="h-screen flex flex-col p-6 bg-white">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/consumer/verify-otp")}
          className="mr-4"
        >
          <span className="material-icons text-neutral-700">arrow_back</span>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-800">Complete Profile</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="mb-4">
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
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="mb-4">
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
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="mb-4">
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
          
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem className="mb-6">
                <Label htmlFor="zip-code" className="block text-neutral-700 font-medium mb-2">
                  ZIP Code
                </Label>
                <FormControl>
                  <Input
                    {...field}
                    id="zip-code"
                    placeholder="560001"
                    maxLength={6}
                    className="w-full border-2 border-neutral-300 rounded-xl p-3 focus:border-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="favoriteCategories"
            render={({ field }) => (
              <FormItem className="mb-6">
                <Label className="block text-neutral-700 font-medium mb-2">
                  Favorite Categories
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
          
          <Button 
            type="submit" 
            className="w-full bg-primary text-white font-semibold py-4 px-6 rounded-xl mb-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Complete Registration"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

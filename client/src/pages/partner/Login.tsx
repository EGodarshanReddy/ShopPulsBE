import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const phoneSchema = z.object({
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number can't be longer than 15 digits")
    .regex(/^\d+$/, "Phone number must contain only digits")
});

type FormValues = z.infer<typeof phoneSchema>;

export default function PartnerLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: ""
    }
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", API_ENDPOINTS.SEND_OTP, values);
      
      // Store phone number to use in OTP verification
      sessionStorage.setItem("phoneForVerification", values.phone);
      
      // Navigate to OTP verification
      navigate("/partner/verify-otp");
      
    } catch (error) {
      console.error("Failed to send OTP:", error);
      toast({
        title: "Failed to send OTP",
        description: "Please check your phone number and try again.",
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
          onClick={() => navigate("/welcome")}
          className="mr-4"
        >
          <span className="material-icons text-neutral-700">arrow_back</span>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-800">Business Login</h1>
      </div>
      
      <p className="text-neutral-600 mb-8">
        Enter your business contact number to continue. We'll send you a verification code.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="mb-6">
                <Label htmlFor="phone" className="block text-neutral-700 font-medium mb-2">
                  Business Phone Number
                </Label>
                <div className="flex items-center border-2 border-neutral-300 rounded-xl p-3 focus-within:border-primary">
                  <span className="text-neutral-500 mr-2">+91</span>
                  <FormControl>
                    <Input
                      {...field}
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-primary text-white font-semibold py-4 px-6 rounded-xl mb-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Continue"}
          </Button>
          
          <p className="text-center text-neutral-500 text-sm">
            By continuing, you agree to our{" "}
            <a href="#" className="text-secondary">Terms of Service</a> and{" "}
            <a href="#" className="text-secondary">Privacy Policy</a>
          </p>
        </form>
      </Form>
    </div>
  );
}

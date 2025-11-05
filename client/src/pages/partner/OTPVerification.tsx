import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { OTPInput } from "@/components/ui/otp-input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

export default function PartnerOTPVerification() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  useEffect(() => {
    const phone = sessionStorage.getItem("phoneForVerification");
    if (!phone) {
      navigate("/partner/login");
      return;
    }
    
    setPhoneNumber(phone);
    
    // Start countdown for OTP resend
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);
  
  const handleVerifyOTP = async (otp: string) => {
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
      const response = await apiRequest("POST", API_ENDPOINTS.VERIFY_OTP, {
        phone: phoneNumber,
        otp
      });
      
      const data = await response.json();
      
      // Check if verification was successful
      if (data.isVerified) {
        // If new user, navigate to registration
        if (data.isNewUser) {
          navigate("/partner/register");
        } else {
          // If existing user, check if they are a partner
          if (data.userType === "partner") {
            // Login and navigate to partner home
            await login(data);
            navigate("/partner/home");
          } else {
            // User exists but is not a partner
            toast({
              title: "Account Type Mismatch",
              description: "This phone number is registered as a consumer account. Please use a different number for your business.",
              variant: "destructive"
            });
          }
        }
      } else {
        toast({
          title: "Verification Failed",
          description: "The OTP you entered is incorrect. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      toast({
        title: "Verification Failed",
        description: "There was an error verifying your OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (!canResend || !phoneNumber) return;
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", API_ENDPOINTS.SEND_OTP, {
        phone: phoneNumber
      });
      
      // Reset timer
      setTimeLeft(60);
      setCanResend(false);
      
      toast({
        title: "OTP Sent",
        description: "A new verification code has been sent to your phone."
      });
      
    } catch (error) {
      console.error("Failed to resend OTP:", error);
      toast({
        title: "Failed to Resend OTP",
        description: "Please try again later.",
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
          onClick={() => navigate("/partner/login")}
          className="mr-4"
        >
          <span className="material-icons text-neutral-700">arrow_back</span>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-800">Verify Phone</h1>
      </div>
      
      <p className="text-neutral-600 mb-8">
        We've sent a verification code to <span className="font-medium">+91 {phoneNumber}</span>
      </p>
      
      <div className="w-full">
        <div className="mb-6">
          <label className="block text-neutral-700 font-medium mb-2">Enter 6-digit code</label>
          <OTPInput 
            length={6} 
            onComplete={handleVerifyOTP} 
            className="flex justify-between space-x-2"
          />
        </div>
        
        <Button 
          type="button" 
          onClick={() => {}} // Will be handled by OTPInput's onComplete
          className="w-full bg-primary text-white font-semibold py-4 px-6 rounded-xl mb-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </Button>
        
        <p className="text-center text-neutral-500 text-sm mb-6">
          Didn't receive code?{" "}
          <button 
            onClick={handleResendOTP}
            disabled={!canResend || isSubmitting}
            className={`${canResend ? "text-secondary font-medium" : "text-neutral-400"}`}
          >
            Resend {!canResend && `(${timeLeft}s)`}
          </button>
        </p>
      </div>
    </div>
  );
}

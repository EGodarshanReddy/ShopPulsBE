import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Welcome() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Redirect to appropriate dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      if (user.userType === "consumer") {
        navigate("/consumer/home");
      } else if (user.userType === "partner") {
        navigate("/partner/home");
      }
    }
  }, [user, isLoading, navigate]);
  
  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-white">
      {/* Hero Image */}
      <img 
        src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
        alt="Store with deals sign" 
        className="w-full h-64 object-cover rounded-2xl mb-8" 
      />
      
      <h1 className="text-4xl font-bold text-neutral-800 mb-3">ODeals!</h1>
      <p className="text-center text-neutral-600 mb-8">
        Discover amazing deals from local businesses and earn rewards
      </p>
      
      <div className="w-full mb-6">
        <Button 
          onClick={() => navigate("/consumer/login")}
          className="w-full bg-primary text-white font-semibold py-4 px-6 rounded-xl mb-4 flex items-center justify-center"
        >
          <span className="material-icons mr-2">person</span>
          Continue as Customer
        </Button>
        
        <Button 
          onClick={() => navigate("/partner/login")}
          variant="outline"
          className="w-full bg-white border-2 border-primary text-primary font-semibold py-4 px-6 rounded-xl flex items-center justify-center"
        >
          <span className="material-icons mr-2">store</span>
          Continue as Business
        </Button>
      </div>
      
      <p className="text-neutral-500 text-sm">
        Already have an account? <a href="#" className="text-secondary font-medium">Log in</a>
      </p>
    </div>
  );
}

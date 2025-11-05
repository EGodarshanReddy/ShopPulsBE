import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/contexts/AuthContext";

// Welcome and Auth Pages
import Welcome from "@/pages/Welcome";
import ConsumerLogin from "@/pages/consumer/Login";
import ConsumerOTPVerification from "@/pages/consumer/OTPVerification";
import ConsumerRegistration from "@/pages/consumer/Registration";
import PartnerLogin from "@/pages/partner/Login";
import PartnerOTPVerification from "@/pages/partner/OTPVerification";
import PartnerRegistration from "@/pages/partner/Registration";

// Consumer Pages
import ConsumerHome from "@/pages/consumer/Home";
import ConsumerExplore from "@/pages/consumer/Explore";
import ConsumerVisits from "@/pages/consumer/Visits";
import ConsumerRewards from "@/pages/consumer/Rewards";
import ConsumerProfile from "@/pages/consumer/Profile";
import ConsumerStoreDetail from "@/pages/consumer/StoreDetail";

// Partner Pages
import PartnerHome from "@/pages/partner/Home";
import PartnerDeals from "@/pages/partner/Deals";
import PartnerAddDeal from "@/pages/partner/AddDeal";
import PartnerEditDeal from "@/pages/partner/EditDeal";
import PartnerAnalytics from "@/pages/partner/Analytics";
import PartnerProfile from "@/pages/partner/Profile";
import PartnerScheduledVisits from "@/pages/partner/ScheduledVisits";

function Router() {
  const [location] = useLocation();

  // Add a meta description based on the current route
  const getMetaDescription = (path: string) => {
    if (path === "/" || path === "/welcome") {
      return "ODeals - Discover amazing deals from local businesses and earn rewards while shopping";
    } else if (path.includes("/consumer")) {
      return "Browse the best deals from local businesses, schedule visits, and earn rewards with ODeals";
    } else if (path.includes("/partner")) {
      return "Grow your business by offering deals, tracking analytics, and connecting with customers through ODeals";
    }
    return "ODeals - Connecting local businesses with customers through amazing deals and rewards";
  };

  return (
    <>
      <meta name="description" content={getMetaDescription(location)} />
      <Switch>
        {/* Welcome and Auth Routes */}
        <Route path="/" component={Welcome} />
        <Route path="/welcome" component={Welcome} />
        
        {/* Consumer Auth Routes */}
        <Route path="/consumer/login" component={ConsumerLogin} />
        <Route path="/consumer/verify-otp" component={ConsumerOTPVerification} />
        <Route path="/consumer/register" component={ConsumerRegistration} />
        
        {/* Partner Auth Routes */}
        <Route path="/partner/login" component={PartnerLogin} />
        <Route path="/partner/verify-otp" component={PartnerOTPVerification} />
        <Route path="/partner/register" component={PartnerRegistration} />
        
        {/* Consumer Routes */}
        <Route path="/consumer/home" component={ConsumerHome} />
        <Route path="/consumer/explore" component={ConsumerExplore} />
        <Route path="/consumer/visits" component={ConsumerVisits} />
        <Route path="/consumer/rewards" component={ConsumerRewards} />
        <Route path="/consumer/profile" component={ConsumerProfile} />
        <Route path="/consumer/store/:id" component={ConsumerStoreDetail} />
        
        {/* Partner Routes */}
        <Route path="/partner/home" component={PartnerHome} />
        <Route path="/partner/deals" component={PartnerDeals} />
        <Route path="/partner/add-deal" component={PartnerAddDeal} />
        <Route path="/partner/edit-deal/:id" component={PartnerEditDeal} />
        <Route path="/partner/analytics" component={PartnerAnalytics} />
        <Route path="/partner/profile" component={PartnerProfile} />
        <Route path="/partner/visits" component={PartnerScheduledVisits} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="app-frame bg-white shadow-lg">
            <Router />
            <Toaster />
          </div>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

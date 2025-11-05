import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { CONSUMER_NAV_ITEMS } from "@/lib/constants";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { CategorySelector } from "@/components/CategorySelector";
import { useAuth } from "@/contexts/AuthContext";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters").max(6, "ZIP code can't be longer than 6 characters"),
  favoriteCategories: z.array(z.string()).min(1, "Please select at least one category")
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const referralSchema = z.object({
  referredPhone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number can't be longer than 15 digits")
    .regex(/^\d+$/, "Phone number must contain only digits")
});

type ReferralFormValues = z.infer<typeof referralSchema>;

export default function ConsumerProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [referFriendOpen, setReferFriendOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/welcome");
    }
  }, [user, isAuthLoading, navigate]);

  // Fetch user profile
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ME],
    enabled: !!user
  });
  
  // Fetch user visits
  const { data: visitsData, isLoading: isVisitsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CONSUMER_VISITS],
    enabled: !!user
  });
  
  // Fetch user referrals
  const { data: referralsData, isLoading: isReferralsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CONSUMER_REFERRALS],
    enabled: !!user
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      return apiRequest("PATCH", API_ENDPOINTS.CONSUMER_PROFILE, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ME] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
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
  
  // Refer friend mutation
  const referFriendMutation = useMutation({
    mutationFn: (data: ReferralFormValues) => {
      return apiRequest("POST", API_ENDPOINTS.CONSUMER_REFERRALS, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CONSUMER_REFERRALS] });
      toast({
        title: "Referral Sent",
        description: "Your friend has been invited to ODeals!"
      });
      setReferFriendOpen(false);
    },
    onError: (error) => {
      console.error("Failed to send referral:", error);
      toast({
        title: "Referral Failed",
        description: "There was an error sending your referral. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profileData?.user?.firstName || "",
      lastName: profileData?.user?.lastName || "",
      email: profileData?.user?.email || "",
      zipCode: profileData?.user?.zipCode || "",
      favoriteCategories: profileData?.user?.favoriteCategories || []
    }
  });
  
  // Update form values when profile data loads
  useEffect(() => {
    if (profileData?.user) {
      profileForm.reset({
        firstName: profileData.user.firstName || "",
        lastName: profileData.user.lastName || "",
        email: profileData.user.email || "",
        zipCode: profileData.user.zipCode || "",
        favoriteCategories: profileData.user.favoriteCategories || []
      });
    }
  }, [profileData, profileForm]);
  
  // Referral form
  const referralForm = useForm<ReferralFormValues>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referredPhone: ""
    }
  });
  
  const handleUpdateProfile = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  const handleReferFriend = (values: ReferralFormValues) => {
    referFriendMutation.mutate(values);
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
          <h1 className="text-2xl font-bold text-neutral-800">Profile</h1>
        </div>
      </div>
      
      <div className="p-4">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-4 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-xl font-bold">
                {profileData?.user?.firstName?.charAt(0) || ""}
                {profileData?.user?.lastName?.charAt(0) || ""}
              </span>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-neutral-800">
                {isProfileLoading ? "Loading..." : (
                  `${profileData?.user?.firstName || ""} ${profileData?.user?.lastName || ""}`
                )}
              </h2>
              <p className="text-neutral-600">{profileData?.user?.phone}</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setEditProfileOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-3 text-center">
            <p className="text-2xl font-bold text-primary mb-1">
              {isVisitsLoading ? "-" : (visitsData?.length || 0)}
            </p>
            <p className="text-sm text-neutral-600">Visits</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-3 text-center">
            <p className="text-2xl font-bold text-secondary mb-1">
              {isReferralsLoading ? "-" : (referralsData?.length || 0)}
            </p>
            <p className="text-sm text-neutral-600">Referrals</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-3 text-center">
            <p className="text-2xl font-bold text-accent mb-1">
              {profileData?.user?.favoriteCategories?.length || 0}
            </p>
            <p className="text-sm text-neutral-600">Categories</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-3">Actions</h2>
          
          <Button
            variant="outline"
            className="w-full flex justify-between items-center py-3 px-4"
            onClick={() => navigate("/consumer/rewards")}
          >
            <div className="flex items-center">
              <span className="material-icons text-accent mr-3">card_giftcard</span>
              <span>My Rewards</span>
            </div>
            <span className="material-icons">chevron_right</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full flex justify-between items-center py-3 px-4"
            onClick={() => setReferFriendOpen(true)}
          >
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-3">people</span>
              <span>Refer a Friend</span>
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
          <p>ODeals</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
      
      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="first-name">First Name</Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="first-name"
                        placeholder="John"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="last-name">Last Name</Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="last-name"
                        placeholder="Doe"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="email">Email</Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="zip-code">ZIP Code</Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="zip-code"
                        placeholder="560001"
                        maxLength={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="favoriteCategories"
                render={({ field }) => (
                  <FormItem>
                    <Label>Favorite Categories</Label>
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
      
      {/* Refer Friend Dialog */}
      <Dialog open={referFriendOpen} onOpenChange={setReferFriendOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Refer a Friend</DialogTitle>
          </DialogHeader>
          
          <Form {...referralForm}>
            <form onSubmit={referralForm.handleSubmit(handleReferFriend)} className="space-y-4">
              <p className="text-sm text-neutral-600">
                Invite your friends to ODeals and earn 1000 points when they join!
              </p>
              
              <FormField
                control={referralForm.control}
                name="referredPhone"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="referred-phone">Friend's Phone Number</Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="referred-phone"
                        placeholder="9876543210"
                        type="tel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <p className="text-xs text-neutral-500">
                A text message with a link to download the app will be sent to this number.
              </p>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReferFriendOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={referFriendMutation.isPending}
                >
                  {referFriendMutation.isPending ? "Sending..." : "Send Invitation"}
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
      <BottomNavigation items={CONSUMER_NAV_ITEMS} />
    </div>
  );
}

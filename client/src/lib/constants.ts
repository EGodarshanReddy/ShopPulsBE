// Business categories
export const BUSINESS_CATEGORIES = [
  "Food", 
  "Men's Apparel", 
  "Women's Apparel", 
  "Kids Wear", 
  "Automobile", 
  "Jewellery", 
  "Men's Salon", 
  "Women's Salon"
] as const;

// Deal types
export const DEAL_TYPES = [
  { id: "discount", label: "Discount", icon: "percent" },
  { id: "freebie", label: "Freebie", icon: "card_giftcard" },
  { id: "special", label: "Special", icon: "local_offer" }
] as const;

// Reward values
export const POINTS_PER_RUPEE = 10; // 100 points = ₹10
export const MIN_REDEMPTION_POINTS = 500; // Minimum points to redeem
export const MAX_REDEMPTION_POINTS = 5000; // Maximum points to redeem at once

// Reward points
export const POINTS_FOR_VISIT = 100;
export const POINTS_FOR_REVIEW = 100;
export const POINTS_FOR_REFERRAL = 1000;

// Navigation items
export const CONSUMER_NAV_ITEMS = [
  { path: "/consumer/home", label: "Home", icon: "home" },
  { path: "/consumer/explore", label: "Explore", icon: "explore" },
  { path: "/consumer/visits", label: "Visits", icon: "event" },
  { path: "/consumer/rewards", label: "Rewards", icon: "card_giftcard" },
  { path: "/consumer/profile", label: "Profile", icon: "person" }
];

export const PARTNER_NAV_ITEMS = [
  { path: "/partner/home", label: "Home", icon: "home" },
  { path: "/partner/deals", label: "Deals", icon: "local_offer" },
  { path: "/partner/visits", label: "Visits", icon: "event" },
  { path: "/partner/profile", label: "Profile", icon: "store" }
];

// Mock business hours for partner stores
export const DEFAULT_BUSINESS_HOURS = {
  monday: { open: "09:00", close: "21:00", isOpen: true },
  tuesday: { open: "09:00", close: "21:00", isOpen: true },
  wednesday: { open: "09:00", close: "21:00", isOpen: true },
  thursday: { open: "09:00", close: "21:00", isOpen: true },
  friday: { open: "09:00", close: "21:00", isOpen: true },
  saturday: { open: "09:00", close: "21:00", isOpen: true },
  sunday: { open: "09:00", close: "21:00", isOpen: true }
};

// API endpoint URLs
export const API_ENDPOINTS = {
  // Auth
  SEND_OTP: '/api/auth/send-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  REGISTER_CONSUMER: '/api/auth/register/consumer',
  REGISTER_PARTNER: '/api/auth/register/partner',
  ME: '/api/auth/me',
  LOGOUT: '/api/auth/logout',
  
  // Consumer
  STORES: '/api/consumer/stores',
  STORE_DETAIL: (id: number) => `/api/consumer/stores/${id}`,
  DEALS: '/api/consumer/deals',
  DEAL_DETAIL: (id: number) => `/api/consumer/deals/${id}`,
  CONSUMER_VISITS: '/api/consumer/visits',
  CONSUMER_REVIEWS: '/api/consumer/reviews',
  CONSUMER_REWARDS: '/api/consumer/rewards',
  CONSUMER_REDEEM: '/api/consumer/redeem',
  CONSUMER_REDEMPTIONS: '/api/consumer/redemptions',
  CONSUMER_REFERRALS: '/api/consumer/referrals',
  CONSUMER_PROFILE: '/api/consumer/profile',
  CONSUMER_NOTIFICATIONS: '/api/consumer/notifications',
  
  // Partner
  PARTNER_STORE: '/api/partner/store',
  PARTNER_DEALS: '/api/partner/deals',
  PARTNER_DEAL: (id: number) => `/api/partner/deals/${id}`,
  PARTNER_DEAL_DEACTIVATE: (id: number) => `/api/partner/deals/${id}/deactivate`,
  PARTNER_VISITS: '/api/partner/visits',
  PARTNER_VISIT_COMPLETE: (id: number) => `/api/partner/visits/${id}/complete`,
  PARTNER_ANALYTICS: '/api/partner/analytics',
  PARTNER_REDEMPTIONS: '/api/partner/redemptions',
  PARTNER_REVIEWS: '/api/partner/reviews',
  
  // Utility
  CATEGORIES: '/api/categories',
  USER_TYPES: '/api/user-types'
};

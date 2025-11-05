import { pgTable, text, serial, integer, boolean, date, timestamp, primaryKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types and roles
export const userTypes = ["consumer", "partner"] as const;
export type UserType = typeof userTypes[number];

// Business categories
export const businessCategories = [
  "Food", 
  "Men's Apparel", 
  "Women's Apparel", 
  "Kids Wear", 
  "Automobile", 
  "Jewellery", 
  "Men's Salon", 
  "Women's Salon"
] as const;
export type BusinessCategory = typeof businessCategories[number];

// Deal types
export const dealTypes = ["discount", "freebie", "special"] as const;
export type DealType = typeof dealTypes[number];

// User tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  zipCode: text("zip_code"),
  favoriteCategories: text("favorite_categories").array(),
  userType: text("user_type").notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
  isVerified: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Partner Store tables
export const partnerStores = pgTable("partner_stores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  contactPhone: text("contact_phone").notNull(),
  location: text("location").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  categories: text("categories").array().notNull(),
  businessHours: json("business_hours"),
  priceRating: integer("price_rating").default(1),
  upiId: text("upi_id"),
  images: text("images").array(),
  servicesOffered: text("services_offered").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPartnerStoreSchema = createInsertSchema(partnerStores).omit({ 
  id: true, 
  createdAt: true,
  userId: true
});

export type InsertPartnerStore = z.infer<typeof insertPartnerStoreSchema>;
export type PartnerStore = typeof partnerStores.$inferSelect;

// Deals tables
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partnerStores.id),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  dealType: text("deal_type").notNull(),
  discountPercentage: integer("discount_percentage"),
  category: text("category").notNull(),
  images: text("images").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDealSchema = createInsertSchema(deals).omit({ 
  id: true, 
  createdAt: true,
  isActive: true
});

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

// Visits tables
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  partnerId: integer("partner_id").notNull().references(() => partnerStores.id),
  visitDate: date("visit_date").notNull(),
  notes: text("notes"),
  dealId: integer("deal_id").references(() => deals.id),
  status: text("status").default("scheduled"),
  markedAsVisited: boolean("marked_as_visited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVisitSchema = createInsertSchema(visits).omit({ 
  id: true, 
  createdAt: true,
  markedAsVisited: true,
  status: true
});

export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visits.$inferSelect;

// Reviews tables
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  partnerId: integer("partner_id").notNull().references(() => partnerStores.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ 
  id: true, 
  createdAt: true,
  isPublished: true
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Rewards tables
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  referenceId: integer("reference_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRewardSchema = createInsertSchema(rewards).omit({ 
  id: true, 
  createdAt: true
});

export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;

// Redemptions tables
export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  partnerId: integer("partner_id").notNull().references(() => partnerStores.id),
  points: integer("points").notNull(),
  amount: integer("amount").notNull(),
  proofImageUrl: text("proof_image_url"),
  code: text("code").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRedemptionSchema = createInsertSchema(redemptions).omit({ 
  id: true, 
  createdAt: true,
  code: true,
  status: true
});

export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;
export type Redemption = typeof redemptions.$inferSelect;

// Referrals tables
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredPhone: text("referred_phone").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({ 
  id: true, 
  createdAt: true,
  status: true
});

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

// OTP Verification
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtpSchema = createInsertSchema(otps).omit({
  id: true,
  createdAt: true,
});

export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Otp = typeof otps.$inferSelect;

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Partner Statistics
export const partnerStats = pgTable("partner_stats", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partnerStores.id),
  date: date("date").notNull(),
  storeViews: integer("store_views").default(0),
  dealViews: integer("deal_views").default(0),
  scheduledVisits: integer("scheduled_visits").default(0),
  actualVisits: integer("actual_visits").default(0),
});

export const partnerStatsPK = primaryKey(partnerStats.partnerId, partnerStats.date);

export const insertPartnerStatSchema = createInsertSchema(partnerStats).omit({
  id: true,
});

export type InsertPartnerStat = z.infer<typeof insertPartnerStatSchema>;
export type PartnerStat = typeof partnerStats.$inferSelect;

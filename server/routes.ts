import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./databaseStorage";
import { generateAndSendOTP, verifyOTP } from "./util/otp";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertPartnerStoreSchema, 
  insertDealSchema, 
  insertVisitSchema,
  insertReviewSchema,
  insertRedemptionSchema,
  insertReferralSchema,
  userTypes,
  businessCategories
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

// Extend express-session with custom session data
declare module "express-session" {
  interface SessionData {
    userId: number;
    userType: string;
  }
}

// Create session store
const SessionStore = MemoryStore(session);

// Define validation schemas
const phoneSchema = z.object({
  phone: z.string().min(10).max(15),
});

const otpVerificationSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

const searchQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().optional().default(10),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'odeals-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));



  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Partner store middleware
  const requirePartnerAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId || req.session.userType !== 'partner') {
      return res.status(401).json({ message: 'Partner authentication required' });
    }
    next();
  };

  // Consumer middleware
  const requireConsumerAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId || req.session.userType !== 'consumer') {
      return res.status(401).json({ message: 'Consumer authentication required' });
    }
    next();
  };

  // ===== AUTH ROUTES =====
  
  // Send OTP for login/registration
  app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    try {
      const { phone } = phoneSchema.parse(req.body);
      
      // Generate and send OTP
      await generateAndSendOTP(phone);
      
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid phone number', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  });

  // Verify OTP and login/register
  app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
    try {
      const { phone, otp } = otpVerificationSchema.parse(req.body);
      
      // Verify OTP
      const isValid = await verifyOTP(phone, otp);
      
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
      
      // Check if user exists
      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        // For verification success but no user yet, return success with isNewUser flag
        return res.status(200).json({ 
          message: 'OTP verified successfully', 
          isVerified: true,
          isNewUser: true 
        });
      }
      
      // Update user verification status if needed
      if (!user.isVerified) {
        const updated = await storage.updateUser(user.id, { isVerified: true });
        if (!updated) {
          return res.status(500).json({ message: 'Failed to update user verification status' });
        }
        user = updated;
      }

      // Set session
      req.session.userId = user.id;
      req.session.userType = user.userType;
      
      res.status(200).json({ 
        message: 'OTP verified successfully',
        isVerified: true,
        isNewUser: false,
        userId: user.id,
        userType: user.userType
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid verification data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to verify OTP' });
    }
  });

  // Register new consumer
  app.post('/api/auth/register/consumer', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse({
        ...req.body,
        userType: 'consumer'
      });
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(userData.phone);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this phone number' });
      }
      
      // Create new user
      const user = await storage.createUser(userData);
      
      // Set session
      req.session.userId = user.id;
      req.session.userType = user.userType;
      
      res.status(201).json({
        message: 'User registered successfully',
        userId: user.id,
        userType: user.userType
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to register user' });
    }
  });

  // Register new partner store
  app.post('/api/auth/register/partner', async (req: Request, res: Response) => {
    try {
      const { userData, storeData } = req.body;
      
      const validUserData = insertUserSchema.parse({
        ...userData,
        userType: 'partner'
      });
      
      const validStoreData = insertPartnerStoreSchema.parse(storeData);
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(validUserData.phone);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this phone number' });
      }
      
      // Create new user
      const user = await storage.createUser(validUserData);
      
      // Create new partner store
      const store = await storage.createPartnerStore(validStoreData, user.id);
      
      // Set session
      req.session.userId = user.id;
      req.session.userType = user.userType;
      
      res.status(201).json({
        message: 'Partner store registered successfully',
        userId: user.id,
        storeId: store.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid registration data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to register partner store' });
    }
  });

  // Get current user
  app.get('/api/auth/me', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(404).json({ message: 'User not found' });
      }
      
      let additionalData = {};
      
      if (user.userType === 'partner') {
        const store = await storage.getPartnerStoreByUserId(userId);
        if (store) {
          additionalData = { store };
        }
      }
      
      // Don't send back sensitive data
      const { ...userData } = user;
      
      res.status(200).json({
        user: userData,
        ...additionalData
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  // ===== CONSUMER ROUTES =====
  
  // Get all partner stores or search
  app.get('/api/consumer/stores', async (req: Request, res: Response) => {
    try {
      const { query, category, lat, lng, radius } = searchQuerySchema.parse(req.query);
      
      let stores;
      
      if (lat && lng) {
        // Get nearby stores
        stores = await storage.getNearbyPartnerStores(lat, lng, radius || 10);
      } else if (category) {
        // Get stores by category
        stores = await storage.getPartnerStoresByCategory(category as any);
      } else if (query) {
        // Search stores
        stores = await storage.searchPartnerStores(query);
      } else {
        // Get all stores
        stores = Array.from((await storage.searchPartnerStores('')));
      }
      
      res.status(200).json(stores);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid search parameters', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to fetch stores' });
    }
  });

  // Get single partner store
  app.get('/api/consumer/stores/:id', async (req: Request, res: Response) => {
    try {
      const storeId = parseInt(req.params.id);
      const store = await storage.getPartnerStoreById(storeId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      // Increment store views
      await storage.incrementStoreViews(storeId);
      
      // Get store deals
      const deals = await storage.getDealsByPartnerId(storeId);
      const activeDeals = deals.filter(deal => deal.isActive);
      
      // Get store reviews
      const reviews = await storage.getReviewsByPartnerId(storeId);
      
      res.status(200).json({
        store,
        deals: activeDeals,
        reviews
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch store details' });
    }
  });

  // Get all active deals or search
  app.get('/api/consumer/deals', async (req: Request, res: Response) => {
    try {
      const { query, category } = searchQuerySchema.parse(req.query);
      
      let deals;
      
      if (category) {
        // Map frontend categories to database categories
        let categoryFilter = category;
        if (category === 'Food') {
          // Get all deals and filter for food-related categories
          deals = await storage.getActiveDeals();
          deals = deals.filter(deal => 
            deal.category === 'cafe' || 
            deal.category === 'restaurant' || 
            deal.category === 'Food'
          );
        } else if (category === "Men's Salon" || category === "Women's Salon") {
          deals = await storage.getActiveDeals();
          deals = deals.filter(deal => 
            deal.category === 'salon' || 
            deal.category === 'spa' || 
            deal.category === category
          );
        } else {
          // For other categories, try direct match first, then filtered approach
          deals = await storage.getDealsByCategory(category as any);
        }
      } else if (query) {
        // Search deals
        deals = await storage.searchDeals(query);
      } else {
        // Get all active deals
        deals = await storage.getActiveDeals();
      }
      
      // Get store info for each deal
      const dealsWithStoreInfo = await Promise.all(deals.map(async (deal) => {
        const store = await storage.getPartnerStoreById(deal.partnerId);
        return {
          ...deal,
          store: store ? {
            id: store.id,
            name: store.name,
            categories: store.categories,
            priceRating: store.priceRating,
            location: store.location,
            latitude: store.latitude,
            longitude: store.longitude
          } : null
        };
      }));
      
      res.status(200).json(dealsWithStoreInfo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid search parameters', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to fetch deals' });
    }
  });

  // Get single deal
  app.get('/api/consumer/deals/:id', async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      const deal = await storage.getDealById(dealId);
      
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      // Increment deal views
      await storage.incrementDealViews(deal.partnerId);
      
      // Get store info
      const store = await storage.getPartnerStoreById(deal.partnerId);
      
      res.status(200).json({
        deal,
        store
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch deal details' });
    }
  });

  // Schedule a visit
  app.post('/api/consumer/visits', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const visitData = insertVisitSchema.parse({
        ...req.body,
        userId
      });
      
      const visit = await storage.createVisit(visitData);
      
      res.status(201).json({
        message: 'Visit scheduled successfully',
        visit
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid visit data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to schedule visit' });
    }
  });

  // Get user visits
  app.get('/api/consumer/visits', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const visits = await storage.getVisitsByUserId(userId);
      
      // Get store info for each visit
      const visitsWithStoreInfo = await Promise.all(visits.map(async (visit) => {
        const store = await storage.getPartnerStoreById(visit.partnerId);
        let dealInfo = null;
        
        if (visit.dealId) {
          const deal = await storage.getDealById(visit.dealId);
          if (deal) {
            dealInfo = {
              id: deal.id,
              name: deal.name,
              dealType: deal.dealType,
              discountPercentage: deal.discountPercentage
            };
          }
        }
        
        return {
          ...visit,
          store: store ? {
            id: store.id,
            name: store.name,
            categories: store.categories,
            location: store.location
          } : null,
          deal: dealInfo
        };
      }));
      
      res.status(200).json(visitsWithStoreInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch visits' });
    }
  });

  // Mark visit as completed
  app.post('/api/consumer/visits/:id/complete', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const visitId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Get the visit to verify ownership
      const visit = await storage.getVisitById(visitId);
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      if (visit.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Mark visit as completed
      const updatedVisit = await storage.markVisitAsCompleted(visitId);
      
      if (!updatedVisit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      // Award points for completing a visit
      await storage.createReward({
        userId: userId,
        points: 100,
        reason: "Completed store visit",
        referenceId: visitId
      });
      
      res.status(200).json({
        message: 'Visit marked as completed',
        visit: updatedVisit
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark visit as completed' });
    }
  });

  // Submit a review
  app.post('/api/consumer/reviews', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId
      });
      
      const review = await storage.createReview(reviewData);
      
      res.status(201).json({
        message: 'Review submitted successfully',
        review
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid review data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to submit review' });
    }
  });

  // Get user rewards
  app.get('/api/consumer/rewards', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const rewards = await storage.getRewardsByUserId(userId);
      const totalPoints = await storage.getTotalRewardPointsByUserId(userId);
      
      res.status(200).json({
        rewards,
        totalPoints
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch rewards' });
    }
  });

  // Redeem rewards
  app.post('/api/consumer/redeem', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const redemptionData = insertRedemptionSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if user has enough points
      const totalPoints = await storage.getTotalRewardPointsByUserId(userId);
      
      if (totalPoints < redemptionData.points) {
        return res.status(400).json({ message: 'Not enough points to redeem' });
      }
      
      // Check if points are at least 500
      if (redemptionData.points < 500) {
        return res.status(400).json({ message: 'Minimum redemption is 500 points' });
      }
      
      // Check if points exceed 5000
      if (redemptionData.points > 5000) {
        return res.status(400).json({ message: 'Maximum redemption is 5000 points' });
      }
      
      const redemption = await storage.createRedemption(redemptionData);
      
      res.status(201).json({
        message: 'Redemption successful',
        redemption
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid redemption data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to process redemption' });
    }
  });

  // Get user redemptions
  app.get('/api/consumer/redemptions', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const redemptions = await storage.getRedemptionsByUserId(userId);
      
      // Get store info for each redemption
      const redemptionsWithStoreInfo = await Promise.all(redemptions.map(async (redemption) => {
        const store = await storage.getPartnerStoreById(redemption.partnerId);
        return {
          ...redemption,
          store: store ? {
            id: store.id,
            name: store.name
          } : null
        };
      }));
      
      res.status(200).json(redemptionsWithStoreInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch redemptions' });
    }
  });

  // Create a referral
  app.post('/api/consumer/referrals', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const referrerId = req.session.userId!;
      const referralData = insertReferralSchema.parse({
        ...req.body,
        referrerId
      });
      
      // Check if referred phone is already a user
      const existingUser = await storage.getUserByPhone(referralData.referredPhone);
      if (existingUser) {
        return res.status(400).json({ message: 'This phone number is already registered' });
      }
      
      const referral = await storage.createReferral(referralData);
      
      res.status(201).json({
        message: 'Referral created successfully',
        referral
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid referral data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create referral' });
    }
  });

  // Get user referrals
  app.get('/api/consumer/referrals', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const referrerId = req.session.userId!;
      const referrals = await storage.getReferralsByReferrerId(referrerId);
      
      res.status(200).json(referrals);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch referrals' });
    }
  });

  // Update user profile
  app.patch('/api/consumer/profile', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // Get user notifications
  app.get('/api/consumer/notifications', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getNotificationsByUserId(userId);
      
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Mark notification as read
  app.patch('/api/consumer/notifications/:id', requireConsumerAuth, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      
      if (!updatedNotification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.status(200).json({
        message: 'Notification marked as read',
        notification: updatedNotification
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });

  // ===== PARTNER STORE ROUTES =====
  
  // Get store profile
  app.get('/api/partner/store', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const store = await storage.getPartnerStoreByUserId(userId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      res.status(200).json(store);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch store profile' });
    }
  });

  // Update store profile
  app.patch('/api/partner/store', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const store = await storage.getPartnerStoreByUserId(userId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const updatedStore = await storage.updatePartnerStore(store.id, req.body);
      
      res.status(200).json({
        message: 'Store profile updated successfully',
        store: updatedStore
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update store profile' });
    }
  });

  // Get store deals
  app.get('/api/partner/deals', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const store = await storage.getPartnerStoreByUserId(userId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const deals = await storage.getDealsByPartnerId(store.id);
      
      res.status(200).json(deals);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch deals' });
    }
  });
  
  // Get a specific deal by ID
  app.get('/api/partner/deals/:id', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ message: 'Invalid deal ID' });
      }
      
      const userId = req.session.userId!;
      const store = await storage.getPartnerStoreByUserId(userId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const deal = await storage.getDealById(dealId);
      
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      // Make sure the deal belongs to this partner
      if (deal.partnerId !== store.id) {
        return res.status(403).json({ message: 'You do not have permission to access this deal' });
      }
      
      res.status(200).json(deal);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch deal' });
    }
  });

  // Create a new deal
  app.post('/api/partner/deals', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const store = await storage.getPartnerStoreByUserId(userId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      // Check if store already has 3 active deals in this category
      const existingDeals = await storage.getDealsByPartnerId(store.id);
      const activeDealsInCategory = existingDeals.filter(
        deal => deal.isActive && deal.category === req.body.category
      );
      
      if (activeDealsInCategory.length >= 3) {
        return res.status(400).json({ 
          message: 'You already have 3 active deals in this category. Deactivate one to create a new deal.' 
        });
      }
      
      const dealData = insertDealSchema.parse({
        ...req.body,
        partnerId: store.id
      });
      
      const deal = await storage.createDeal(dealData);
      
      res.status(201).json({
        message: 'Deal created successfully',
        deal
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid deal data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create deal' });
    }
  });

  // Update a deal
  app.patch('/api/partner/deals/:id', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const dealId = parseInt(req.params.id);
      
      const store = await storage.getPartnerStoreByUserId(userId);
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const deal = await storage.getDealById(dealId);
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      if (deal.partnerId !== store.id) {
        return res.status(403).json({ message: 'You do not have permission to update this deal' });
      }
      
      const updatedDeal = await storage.updateDeal(dealId, req.body);
      
      res.status(200).json({
        message: 'Deal updated successfully',
        deal: updatedDeal
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update deal' });
    }
  });

  // Deactivate a deal
  app.post('/api/partner/deals/:id/deactivate', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const dealId = parseInt(req.params.id);
      
      const store = await storage.getPartnerStoreByUserId(userId);
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const deal = await storage.getDealById(dealId);
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      if (deal.partnerId !== store.id) {
        return res.status(403).json({ message: 'You do not have permission to deactivate this deal' });
      }
      
      const deactivatedDeal = await storage.deactivateDeal(dealId);
      
      res.status(200).json({
        message: 'Deal deactivated successfully',
        deal: deactivatedDeal
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to deactivate deal' });
    }
  });

  // Get scheduled visits
  app.get('/api/partner/visits', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const store = await storage.getPartnerStoreByUserId(userId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const visits = await storage.getScheduledVisitsByPartnerId(store.id);
      
      // Get user info for each visit
      const visitsWithUserInfo = await Promise.all(visits.map(async (visit) => {
        const user = await storage.getUserById(visit.userId);
        let dealInfo = null;
        
        if (visit.dealId) {
          const deal = await storage.getDealById(visit.dealId);
          if (deal) {
            dealInfo = {
              id: deal.id,
              name: deal.name
            };
          }
        }
        
        return {
          ...visit,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone
          } : null,
          deal: dealInfo
        };
      }));
      
      res.status(200).json(visitsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch scheduled visits' });
    }
  });

  // Mark visit as completed
  app.post('/api/partner/visits/:id/complete', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const visitId = parseInt(req.params.id);
      
      const store = await storage.getPartnerStoreByUserId(userId);
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const visit = await storage.getVisitById(visitId);
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      if (visit.partnerId !== store.id) {
        return res.status(403).json({ message: 'You do not have permission to update this visit' });
      }
      
      const completedVisit = await storage.markVisitAsCompleted(visitId);
      
      res.status(200).json({
        message: 'Visit marked as completed',
        visit: completedVisit
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update visit' });
    }
  });

  // Get store analytics
  app.get('/api/partner/analytics', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const store = await storage.getPartnerStoreByUserId(userId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      // Get analytics for past 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const stats = await storage.getPartnerStatsByDateRange(store.id, startDate, endDate);
      
      // Calculate totals
  const totalStoreViews = stats.reduce((total, stat) => total + (stat.storeViews ?? 0), 0);
  const totalDealViews = stats.reduce((total, stat) => total + (stat.dealViews ?? 0), 0);
  const totalScheduledVisits = stats.reduce((total, stat) => total + (stat.scheduledVisits ?? 0), 0);
  const totalActualVisits = stats.reduce((total, stat) => total + (stat.actualVisits ?? 0), 0);
      
      res.status(200).json({
        stats,
        totals: {
          storeViews: totalStoreViews,
          dealViews: totalDealViews,
          scheduledVisits: totalScheduledVisits,
          actualVisits: totalActualVisits
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Get redemptions
  app.get('/api/partner/redemptions', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const store = await storage.getPartnerStoreByUserId(userId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const redemptions = await storage.getRedemptionsByPartnerId(store.id);
      
      // Get user info for each redemption
      const redemptionsWithUserInfo = await Promise.all(redemptions.map(async (redemption) => {
        const user = await storage.getUserById(redemption.userId);
        return {
          ...redemption,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName
          } : null
        };
      }));
      
      // Calculate total due amount
      const pendingRedemptions = redemptionsWithUserInfo.filter(r => r.status === 'pending');
      const totalDueAmount = pendingRedemptions.reduce((total, r) => total + r.amount, 0);
      
      res.status(200).json({
        redemptions: redemptionsWithUserInfo,
        totalDueAmount
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch redemptions' });
    }
  });

  // Get store reviews
  app.get('/api/partner/reviews', requirePartnerAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const store = await storage.getPartnerStoreByUserId(userId);
      
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const reviews = await storage.getReviewsByPartnerId(store.id);
      
      // Get user info for each review
      const reviewsWithUserInfo = await Promise.all(reviews.map(async (review) => {
        const user = await storage.getUserById(review.userId);
        return {
          ...review,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName
          } : null
        };
      }));
      
      res.status(200).json(reviewsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  });

  // ===== UTILITY ROUTES =====
  
  // Get business categories
  app.get('/api/categories', (req: Request, res: Response) => {
    res.status(200).json(businessCategories);
  });

  // Get user types
  app.get('/api/user-types', (req: Request, res: Response) => {
    res.status(200).json(userTypes);
  });

  const httpServer = createServer(app);
  return httpServer;
}

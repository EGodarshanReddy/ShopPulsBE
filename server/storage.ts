import { 
  User, InsertUser, users,
  PartnerStore, InsertPartnerStore, partnerStores,
  Deal, InsertDeal, deals,
  Visit, InsertVisit, visits,
  Review, InsertReview, reviews,
  Reward, InsertReward, rewards,
  Redemption, InsertRedemption, redemptions,
  Referral, InsertReferral, referrals,
  Otp, InsertOtp, otps,
  Notification, InsertNotification, notifications,
  PartnerStat, InsertPartnerStat, partnerStats,
  UserType, BusinessCategory
} from "@shared/schema";

import { nanoid } from "nanoid";

export interface IStorage {
  // User methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Partner store methods
  getPartnerStoreById(id: number): Promise<PartnerStore | undefined>;
  getPartnerStoreByUserId(userId: number): Promise<PartnerStore | undefined>;
  createPartnerStore(store: InsertPartnerStore, userId: number): Promise<PartnerStore>;
  updatePartnerStore(id: number, store: Partial<PartnerStore>): Promise<PartnerStore | undefined>;
  getPartnerStoresByCategory(category: BusinessCategory): Promise<PartnerStore[]>;
  getNearbyPartnerStores(lat: number, lng: number, radius: number): Promise<PartnerStore[]>;
  searchPartnerStores(query: string): Promise<PartnerStore[]>;
  
  // Deal methods
  getDealById(id: number): Promise<Deal | undefined>;
  getDealsByPartnerId(partnerId: number): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<Deal>): Promise<Deal | undefined>;
  deactivateDeal(id: number): Promise<Deal | undefined>;
  getActiveDeals(): Promise<Deal[]>;
  getDealsByCategory(category: BusinessCategory): Promise<Deal[]>;
  searchDeals(query: string): Promise<Deal[]>;
  
  // Visit methods
  getVisitById(id: number): Promise<Visit | undefined>;
  getVisitsByUserId(userId: number): Promise<Visit[]>;
  getScheduledVisitsByPartnerId(partnerId: number): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: number, visit: Partial<Visit>): Promise<Visit | undefined>;
  markVisitAsCompleted(id: number): Promise<Visit | undefined>;
  
  // Review methods
  getReviewById(id: number): Promise<Review | undefined>;
  getReviewsByPartnerId(partnerId: number): Promise<Review[]>;
  getReviewsByUserId(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  publishReview(id: number): Promise<Review | undefined>;
  
  // Reward methods
  getRewardsByUserId(userId: number): Promise<Reward[]>;
  getTotalRewardPointsByUserId(userId: number): Promise<number>;
  createReward(reward: InsertReward): Promise<Reward>;
  
  // Redemption methods
  getRedemptionById(id: number): Promise<Redemption | undefined>;
  getRedemptionsByUserId(userId: number): Promise<Redemption[]>;
  getRedemptionsByPartnerId(partnerId: number): Promise<Redemption[]>;
  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  updateRedemptionStatus(id: number, status: string): Promise<Redemption | undefined>;
  
  // Referral methods
  getReferralById(id: number): Promise<Referral | undefined>;
  getReferralsByReferrerId(referrerId: number): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferralStatus(id: number, status: string): Promise<Referral | undefined>;
  
  // OTP methods
  createOtp(otp: InsertOtp): Promise<Otp>;
  getOtpByPhone(phone: string): Promise<Otp | undefined>;
  verifyOtp(phone: string, otp: string): Promise<boolean>;
  
  // Notification methods
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Partner Statistics methods
  getPartnerStatsByDateRange(partnerId: number, startDate: Date, endDate: Date): Promise<PartnerStat[]>;
  createOrUpdatePartnerStats(stats: InsertPartnerStat): Promise<PartnerStat>;
  incrementStoreViews(partnerId: number): Promise<void>;
  incrementDealViews(partnerId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private partnerStores: Map<number, PartnerStore>;
  private deals: Map<number, Deal>;
  private visits: Map<number, Visit>;
  private reviews: Map<number, Review>;
  private rewards: Map<number, Reward>;
  private redemptions: Map<number, Redemption>;
  private referrals: Map<number, Referral>;
  private otps: Map<string, Otp>;
  private notifications: Map<number, Notification>;
  private partnerStats: Map<string, PartnerStat>;
  
  private userIdCounter: number;
  private partnerStoreIdCounter: number;
  private dealIdCounter: number;
  private visitIdCounter: number;
  private reviewIdCounter: number;
  private rewardIdCounter: number;
  private redemptionIdCounter: number;
  private referralIdCounter: number;
  private otpIdCounter: number;
  private notificationIdCounter: number;
  private partnerStatIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.partnerStores = new Map();
    this.deals = new Map();
    this.visits = new Map();
    this.reviews = new Map();
    this.rewards = new Map();
    this.redemptions = new Map();
    this.referrals = new Map();
    this.otps = new Map();
    this.notifications = new Map();
    this.partnerStats = new Map();
    
    this.userIdCounter = 1;
    this.partnerStoreIdCounter = 1;
    this.dealIdCounter = 1;
    this.visitIdCounter = 1;
    this.reviewIdCounter = 1;
    this.rewardIdCounter = 1;
    this.redemptionIdCounter = 1;
    this.referralIdCounter = 1;
    this.otpIdCounter = 1;
    this.notificationIdCounter = 1;
    this.partnerStatIdCounter = 1;
  }
  
  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const newUser: User = { 
      ...user, 
      id, 
      createdAt, 
      isVerified: false,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      email: user.email || null,
      zipCode: user.zipCode || null,
      favoriteCategories: user.favoriteCategories || null
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Partner store methods
  async getPartnerStoreById(id: number): Promise<PartnerStore | undefined> {
    return this.partnerStores.get(id);
  }
  
  async getPartnerStoreByUserId(userId: number): Promise<PartnerStore | undefined> {
    return Array.from(this.partnerStores.values()).find(store => store.userId === userId);
  }
  
  async createPartnerStore(store: InsertPartnerStore, userId: number): Promise<PartnerStore> {
    const id = this.partnerStoreIdCounter++;
    const createdAt = new Date();
    const newStore: PartnerStore = { 
      ...store, 
      id, 
      userId, 
      createdAt,
      description: store.description || null,
      latitude: store.latitude || null,
      longitude: store.longitude || null,
      businessHours: store.businessHours || null,
      priceRating: store.priceRating || null,
      upiId: store.upiId || null,
      images: store.images || null,
      servicesOffered: store.servicesOffered || null
    };
    this.partnerStores.set(id, newStore);
    return newStore;
  }
  
  async updatePartnerStore(id: number, storeData: Partial<PartnerStore>): Promise<PartnerStore | undefined> {
    const store = this.partnerStores.get(id);
    if (!store) return undefined;
    
    const updatedStore = { ...store, ...storeData };
    this.partnerStores.set(id, updatedStore);
    return updatedStore;
  }
  
  async getPartnerStoresByCategory(category: BusinessCategory): Promise<PartnerStore[]> {
    return Array.from(this.partnerStores.values())
      .filter(store => store.categories.includes(category));
  }
  
  async getNearbyPartnerStores(lat: number, lng: number, radius: number): Promise<PartnerStore[]> {
    // In a real implementation, this would use geospatial queries
    // For simplicity in memory storage, we'll just return all stores
    return Array.from(this.partnerStores.values());
  }
  
  async searchPartnerStores(query: string): Promise<PartnerStore[]> {
    if (!query) return Array.from(this.partnerStores.values());
    
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.partnerStores.values())
      .filter(store => {
        return (
          store.name.toLowerCase().includes(lowercaseQuery) ||
          (store.description && store.description.toLowerCase().includes(lowercaseQuery))
        );
      });
  }
  
  // Deal methods
  async getDealById(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }
  
  async getDealsByPartnerId(partnerId: number): Promise<Deal[]> {
    return Array.from(this.deals.values())
      .filter(deal => deal.partnerId === partnerId);
  }
  
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const id = this.dealIdCounter++;
    const createdAt = new Date();
    const newDeal: Deal = { 
      ...deal, 
      id, 
      createdAt, 
      isActive: true,
      description: deal.description || null,
      images: deal.images || null,
      discountPercentage: deal.discountPercentage || null
    };
    this.deals.set(id, newDeal);
    return newDeal;
  }
  
  async updateDeal(id: number, dealData: Partial<Deal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const updatedDeal = { ...deal, ...dealData };
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }
  
  async deactivateDeal(id: number): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const updatedDeal = { ...deal, isActive: false };
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }
  
  async getActiveDeals(): Promise<Deal[]> {
    const now = new Date();
    return Array.from(this.deals.values())
      .filter(deal => {
        const startDate = new Date(deal.startDate);
        const endDate = new Date(deal.endDate);
        return deal.isActive && startDate <= now && endDate >= now;
      });
  }
  
  async getDealsByCategory(category: BusinessCategory): Promise<Deal[]> {
    return Array.from(this.deals.values())
      .filter(deal => deal.category === category && deal.isActive);
  }
  
  async searchDeals(query: string): Promise<Deal[]> {
    if (!query) return this.getActiveDeals();
    
    const lowercaseQuery = query.toLowerCase();
    const activeDeals = await this.getActiveDeals();
    
    return activeDeals.filter(deal => {
      return (
        deal.name.toLowerCase().includes(lowercaseQuery) ||
        (deal.description && deal.description.toLowerCase().includes(lowercaseQuery))
      );
    });
  }
  
  // Visit methods
  async getVisitById(id: number): Promise<Visit | undefined> {
    return this.visits.get(id);
  }
  
  async getVisitsByUserId(userId: number): Promise<Visit[]> {
    return Array.from(this.visits.values())
      .filter(visit => visit.userId === userId);
  }
  
  async getScheduledVisitsByPartnerId(partnerId: number): Promise<Visit[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.visits.values())
      .filter(visit => {
        const visitDate = new Date(visit.visitDate);
        return visit.partnerId === partnerId && 
          visit.status === 'scheduled' && 
          visitDate >= today;
      });
  }
  
  async createVisit(visit: InsertVisit): Promise<Visit> {
    const id = this.visitIdCounter++;
    const createdAt = new Date();
    const newVisit: Visit = { 
      ...visit, 
      id, 
      createdAt, 
      status: 'scheduled', 
      markedAsVisited: false,
      notes: visit.notes || null,
      dealId: visit.dealId || null
    };
    this.visits.set(id, newVisit);
    
    // Update partner stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.incrementScheduledVisits(visit.partnerId);
    
    return newVisit;
  }
  
  async updateVisit(id: number, visitData: Partial<Visit>): Promise<Visit | undefined> {
    const visit = this.visits.get(id);
    if (!visit) return undefined;
    
    const updatedVisit = { ...visit, ...visitData };
    this.visits.set(id, updatedVisit);
    return updatedVisit;
  }
  
  async markVisitAsCompleted(id: number): Promise<Visit | undefined> {
    const visit = this.visits.get(id);
    if (!visit) return undefined;
    
    const updatedVisit = { ...visit, status: 'completed', markedAsVisited: true };
    this.visits.set(id, updatedVisit);
    
    // Update partner stats
    this.incrementActualVisits(visit.partnerId);
    
    // Reward points for visiting
    this.createReward({
      userId: visit.userId,
      points: 100,
      reason: "Visited a partner store",
      referenceId: visit.id
    });
    
    return updatedVisit;
  }
  
  // Review methods
  async getReviewById(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }
  
  async getReviewsByPartnerId(partnerId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.partnerId === partnerId && review.isPublished);
  }
  
  async getReviewsByUserId(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.userId === userId);
  }
  
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const createdAt = new Date();
    const newReview: Review = { 
      ...review, 
      id, 
      createdAt, 
      isPublished: false,
      comment: review.comment || null
    };
    this.reviews.set(id, newReview);
    
    // Reward points for writing a review
    this.createReward({
      userId: review.userId,
      points: 100,
      reason: "Wrote a review",
      referenceId: id
    });
    
    return newReview;
  }
  
  async publishReview(id: number): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    
    const updatedReview = { ...review, isPublished: true };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }
  
  // Reward methods
  async getRewardsByUserId(userId: number): Promise<Reward[]> {
    return Array.from(this.rewards.values())
      .filter(reward => reward.userId === userId);
  }
  
  async getTotalRewardPointsByUserId(userId: number): Promise<number> {
    const rewards = await this.getRewardsByUserId(userId);
    return rewards.reduce((total, reward) => total + reward.points, 0);
  }
  
  async createReward(reward: InsertReward): Promise<Reward> {
    const id = this.rewardIdCounter++;
    const createdAt = new Date();
    const newReward: Reward = { 
      ...reward, 
      id, 
      createdAt,
      referenceId: reward.referenceId || null
    };
    this.rewards.set(id, newReward);
    return newReward;
  }
  
  // Redemption methods
  async getRedemptionById(id: number): Promise<Redemption | undefined> {
    return this.redemptions.get(id);
  }
  
  async getRedemptionsByUserId(userId: number): Promise<Redemption[]> {
    return Array.from(this.redemptions.values())
      .filter(redemption => redemption.userId === userId);
  }
  
  async getRedemptionsByPartnerId(partnerId: number): Promise<Redemption[]> {
    return Array.from(this.redemptions.values())
      .filter(redemption => redemption.partnerId === partnerId);
  }
  
  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const id = this.redemptionIdCounter++;
    const createdAt = new Date();
    const code = nanoid(6).toUpperCase();
    const newRedemption: Redemption = { 
      ...redemption, 
      id, 
      createdAt, 
      code, 
      status: 'pending',
      proofImageUrl: redemption.proofImageUrl || null
    };
    this.redemptions.set(id, newRedemption);
    
    // Subtract points from user
    this.createReward({
      userId: redemption.userId,
      points: -redemption.points,
      reason: "Redeemed points",
      referenceId: id
    });
    
    return newRedemption;
  }
  
  async updateRedemptionStatus(id: number, status: string): Promise<Redemption | undefined> {
    const redemption = this.redemptions.get(id);
    if (!redemption) return undefined;
    
    const updatedRedemption = { ...redemption, status };
    this.redemptions.set(id, updatedRedemption);
    return updatedRedemption;
  }
  
  // Referral methods
  async getReferralById(id: number): Promise<Referral | undefined> {
    return this.referrals.get(id);
  }
  
  async getReferralsByReferrerId(referrerId: number): Promise<Referral[]> {
    return Array.from(this.referrals.values())
      .filter(referral => referral.referrerId === referrerId);
  }
  
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const id = this.referralIdCounter++;
    const createdAt = new Date();
    const newReferral: Referral = { ...referral, id, createdAt, status: 'pending' };
    this.referrals.set(id, newReferral);
    return newReferral;
  }
  
  async updateReferralStatus(id: number, status: string): Promise<Referral | undefined> {
    const referral = this.referrals.get(id);
    if (!referral) return undefined;
    
    const updatedReferral = { ...referral, status };
    this.referrals.set(id, updatedReferral);
    
    // If referral is completed, reward both users
    if (status === 'completed') {
      const referrer = await this.getUserById(referral.referrerId);
      const referred = await this.getUserByPhone(referral.referredPhone);
      
      if (referrer && referred) {
        // Reward referrer
        this.createReward({
          userId: referrer.id,
          points: 1000,
          reason: "Successful referral",
          referenceId: id
        });
        
        // Reward referred user
        this.createReward({
          userId: referred.id,
          points: 1000,
          reason: "Joined through referral",
          referenceId: id
        });
      }
    }
    
    return updatedReferral;
  }
  
  // OTP methods
  async createOtp(otp: InsertOtp): Promise<Otp> {
    const id = this.otpIdCounter++;
    const createdAt = new Date();
    const newOtp: Otp = { ...otp, id, createdAt };
    this.otps.set(otp.phone, newOtp);
    return newOtp;
  }
  
  async getOtpByPhone(phone: string): Promise<Otp | undefined> {
    return this.otps.get(phone);
  }
  
  async verifyOtp(phone: string, otpValue: string): Promise<boolean> {
    const otp = await this.getOtpByPhone(phone);
    if (!otp) return false;
    
    const expiresAt = new Date(otp.expiresAt);
    const now = new Date();
    
    if (expiresAt < now) return false;
    
    return otp.otp === otpValue;
  }
  
  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const createdAt = new Date();
    const newNotification: Notification = { 
      ...notification, 
      id, 
      createdAt, 
      isRead: false 
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  // Partner Statistics methods
  async getPartnerStatsByDateRange(partnerId: number, startDate: Date, endDate: Date): Promise<PartnerStat[]> {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return Array.from(this.partnerStats.values())
      .filter(stat => {
        const statDate = new Date(stat.date);
        return stat.partnerId === partnerId && 
          statDate >= startDate && 
          statDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async createOrUpdatePartnerStats(stats: InsertPartnerStat): Promise<PartnerStat> {
    const key = `${stats.partnerId}_${stats.date.toISOString().split('T')[0]}`;
    const existingStat = this.partnerStats.get(key);
    
    if (existingStat) {
      const updatedStat = { ...existingStat, ...stats };
      this.partnerStats.set(key, updatedStat);
      return updatedStat;
    } else {
      const id = this.partnerStatIdCounter++;
      const newStat: PartnerStat = { 
        ...stats, 
        id,
        storeViews: stats.storeViews || 0,
        dealViews: stats.dealViews || 0,
        scheduledVisits: stats.scheduledVisits || 0,
        actualVisits: stats.actualVisits || 0
      };
      this.partnerStats.set(key, newStat);
      return newStat;
    }
  }
  
  async incrementStoreViews(partnerId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const key = `${partnerId}_${today.toISOString().split('T')[0]}`;
    const existingStat = this.partnerStats.get(key);
    
    if (existingStat) {
      const updatedStat = { 
        ...existingStat, 
        storeViews: existingStat.storeViews + 1 
      };
      this.partnerStats.set(key, updatedStat);
    } else {
      await this.createOrUpdatePartnerStats({
        partnerId,
        date: today,
        storeViews: 1,
        dealViews: 0,
        scheduledVisits: 0,
        actualVisits: 0
      });
    }
  }
  
  async incrementDealViews(partnerId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const key = `${partnerId}_${today.toISOString().split('T')[0]}`;
    const existingStat = this.partnerStats.get(key);
    
    if (existingStat) {
      const updatedStat = { 
        ...existingStat, 
        dealViews: existingStat.dealViews + 1 
      };
      this.partnerStats.set(key, updatedStat);
    } else {
      await this.createOrUpdatePartnerStats({
        partnerId,
        date: today,
        storeViews: 0,
        dealViews: 1,
        scheduledVisits: 0,
        actualVisits: 0
      });
    }
  }
  
  private async incrementScheduledVisits(partnerId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const key = `${partnerId}_${today.toISOString().split('T')[0]}`;
    const existingStat = this.partnerStats.get(key);
    
    if (existingStat) {
      const updatedStat = { 
        ...existingStat, 
        scheduledVisits: existingStat.scheduledVisits + 1 
      };
      this.partnerStats.set(key, updatedStat);
    } else {
      await this.createOrUpdatePartnerStats({
        partnerId,
        date: today,
        storeViews: 0,
        dealViews: 0,
        scheduledVisits: 1,
        actualVisits: 0
      });
    }
  }
  
  private async incrementActualVisits(partnerId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const key = `${partnerId}_${today.toISOString().split('T')[0]}`;
    const existingStat = this.partnerStats.get(key);
    
    if (existingStat) {
      const updatedStat = { 
        ...existingStat, 
        actualVisits: existingStat.actualVisits + 1 
      };
      this.partnerStats.set(key, updatedStat);
    } else {
      await this.createOrUpdatePartnerStats({
        partnerId,
        date: today,
        storeViews: 0,
        dealViews: 0,
        scheduledVisits: 0,
        actualVisits: 1
      });
    }
  }
}

// Use MemStorage for compatibility with current checkpoint
export const storage = new MemStorage();

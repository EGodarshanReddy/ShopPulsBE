import { 
  users, type User, type InsertUser,
  partnerStores, type PartnerStore, type InsertPartnerStore,
  deals, type Deal, type InsertDeal,
  visits, type Visit, type InsertVisit,
  reviews, type Review, type InsertReview,
  rewards, type Reward, type InsertReward,
  redemptions, type Redemption, type InsertRedemption,
  referrals, type Referral, type InsertReferral,
  otps, type Otp, type InsertOtp,
  notifications, type Notification, type InsertNotification,
  partnerStats, type PartnerStat, type InsertPartnerStat,
  BusinessCategory
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Partner store methods
  async getPartnerStoreById(id: number): Promise<PartnerStore | undefined> {
    const [store] = await db.select().from(partnerStores).where(eq(partnerStores.id, id));
    return store;
  }

  async getPartnerStoreByUserId(userId: number): Promise<PartnerStore | undefined> {
    const [store] = await db.select().from(partnerStores).where(eq(partnerStores.userId, userId));
    return store;
  }

  async createPartnerStore(store: InsertPartnerStore, userId: number): Promise<PartnerStore> {
    const [newStore] = await db
      .insert(partnerStores)
      .values({
        ...store,
        userId
      })
      .returning();
    return newStore;
  }

  async updatePartnerStore(id: number, storeData: Partial<PartnerStore>): Promise<PartnerStore | undefined> {
    const [updatedStore] = await db
      .update(partnerStores)
      .set(storeData)
      .where(eq(partnerStores.id, id))
      .returning();
    return updatedStore;
  }

  async getPartnerStoresByCategory(category: BusinessCategory): Promise<PartnerStore[]> {
    // Using SQL for array contains operation since categories is an array
    return db
      .select()
      .from(partnerStores)
      .where(sql`${partnerStores.categories}::text[] @> ARRAY[${category}]::text[]`);
  }

  async getNearbyPartnerStores(lat: number, lng: number, radius: number): Promise<PartnerStore[]> {
    // Simplified version - in production we'd use PostgreSQL's PostGIS extension
    // For now, just return all stores
    return db.select().from(partnerStores);
  }

  async searchPartnerStores(query: string): Promise<PartnerStore[]> {
    if (!query) return db.select().from(partnerStores);
    
    const searchQuery = `%${query.toLowerCase()}%`;
    
    return db
      .select()
      .from(partnerStores)
      .where(
        sql`LOWER(${partnerStores.name}) LIKE ${searchQuery} OR
            COALESCE(LOWER(${partnerStores.description}), '') LIKE ${searchQuery}`
      );
  }

  // Deal methods
  async getDealById(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async getDealsByPartnerId(partnerId: number): Promise<Deal[]> {
    return db
      .select()
      .from(deals)
      .where(eq(deals.partnerId, partnerId))
      .orderBy(desc(deals.createdAt));
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: number, dealData: Partial<Deal>): Promise<Deal | undefined> {
    const [updatedDeal] = await db
      .update(deals)
      .set(dealData)
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal;
  }

  async deactivateDeal(id: number): Promise<Deal | undefined> {
    const [deactivatedDeal] = await db
      .update(deals)
      .set({ isActive: false })
      .where(eq(deals.id, id))
      .returning();
    return deactivatedDeal;
  }

  async getActiveDeals(): Promise<Deal[]> {
    const today = new Date();
    
    return db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.isActive, true),
          sql`${deals.startDate}::date <= ${today.toISOString()}::date`,
          sql`${deals.endDate}::date >= ${today.toISOString()}::date`
        )
      );
  }

  async getDealsByCategory(category: BusinessCategory): Promise<Deal[]> {
    const today = new Date();
    
    return db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.isActive, true),
          sql`${deals.startDate}::date <= ${today.toISOString()}::date`,
          sql`${deals.endDate}::date >= ${today.toISOString()}::date`,
          eq(deals.category, category)
        )
      );
  }

  async searchDeals(query: string): Promise<Deal[]> {
    if (!query) return this.getActiveDeals();
    
    const today = new Date();
    const searchQuery = `%${query.toLowerCase()}%`;
    
    return db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.isActive, true),
          sql`${deals.startDate}::date <= ${today.toISOString()}::date`,
          sql`${deals.endDate}::date >= ${today.toISOString()}::date`,
          sql`LOWER(${deals.name}) LIKE ${searchQuery} OR 
              COALESCE(LOWER(${deals.description}), '') LIKE ${searchQuery}`
        )
      );
  }

  // Visit methods
  async getVisitById(id: number): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit;
  }

  async getVisitsByUserId(userId: number): Promise<Visit[]> {
    return db
      .select()
      .from(visits)
      .where(eq(visits.userId, userId))
      .orderBy(desc(visits.visitDate));
  }

  async getScheduledVisitsByPartnerId(partnerId: number): Promise<Visit[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return db
      .select()
      .from(visits)
      .where(
        and(
          eq(visits.partnerId, partnerId),
          eq(visits.status, 'scheduled'),
          sql`${visits.visitDate}::date >= ${today.toISOString()}::date`
        )
      )
      .orderBy(asc(visits.visitDate));
  }

  async createVisit(visit: InsertVisit): Promise<Visit> {
    const [newVisit] = await db.insert(visits).values(visit).returning();
    // Update partner stats
    await this.incrementScheduledVisits(visit.partnerId);
    return newVisit;
  }

  async updateVisit(id: number, visitData: Partial<Visit>): Promise<Visit | undefined> {
    const [updatedVisit] = await db
      .update(visits)
      .set(visitData)
      .where(eq(visits.id, id))
      .returning();
    return updatedVisit;
  }

  async markVisitAsCompleted(id: number): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    
    if (!visit) return undefined;
    
    const [updatedVisit] = await db
      .update(visits)
      .set({ 
        status: 'completed',
        markedAsVisited: true
      })
      .where(eq(visits.id, id))
      .returning();
    
    await this.incrementActualVisits(visit.partnerId);
    
    return updatedVisit;
  }

  // Review methods
  async getReviewById(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByPartnerId(partnerId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.partnerId, partnerId),
          eq(reviews.isPublished, true)
        )
      )
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByUserId(userId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async publishReview(id: number): Promise<Review | undefined> {
    const [publishedReview] = await db
      .update(reviews)
      .set({ isPublished: true })
      .where(eq(reviews.id, id))
      .returning();
    return publishedReview;
  }

  // Reward methods
  async getRewardsByUserId(userId: number): Promise<Reward[]> {
    return db
      .select()
      .from(rewards)
      .where(eq(rewards.userId, userId))
      .orderBy(desc(rewards.createdAt));
  }

  async getTotalRewardPointsByUserId(userId: number): Promise<number> {
    const result = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${rewards.points}), 0)` 
      })
      .from(rewards)
      .where(eq(rewards.userId, userId));
    
    return result[0]?.total || 0;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  // Redemption methods
  async getRedemptionById(id: number): Promise<Redemption | undefined> {
    const [redemption] = await db.select().from(redemptions).where(eq(redemptions.id, id));
    return redemption;
  }

  async getRedemptionsByUserId(userId: number): Promise<Redemption[]> {
    return db
      .select()
      .from(redemptions)
      .where(eq(redemptions.userId, userId))
      .orderBy(desc(redemptions.createdAt));
  }

  async getRedemptionsByPartnerId(partnerId: number): Promise<Redemption[]> {
    return db
      .select()
      .from(redemptions)
      .where(eq(redemptions.partnerId, partnerId))
      .orderBy(desc(redemptions.createdAt));
  }

  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const [newRedemption] = await db.insert(redemptions).values(redemption).returning();
    return newRedemption;
  }

  async updateRedemptionStatus(id: number, status: string): Promise<Redemption | undefined> {
    const [updatedRedemption] = await db
      .update(redemptions)
      .set({ status })
      .where(eq(redemptions.id, id))
      .returning();
    return updatedRedemption;
  }

  // Referral methods
  async getReferralById(id: number): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral;
  }

  async getReferralsByReferrerId(referrerId: number): Promise<Referral[]> {
    return db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId))
      .orderBy(desc(referrals.createdAt));
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals).values(referral).returning();
    return newReferral;
  }

  async updateReferralStatus(id: number, status: string): Promise<Referral | undefined> {
    const [updatedReferral] = await db
      .update(referrals)
      .set({ status })
      .where(eq(referrals.id, id))
      .returning();
    return updatedReferral;
  }

  // OTP methods
  async createOtp(otp: InsertOtp): Promise<Otp> {
    // Delete any existing OTPs for this phone number first
    await db.delete(otps).where(eq(otps.phone, otp.phone));
    
    // Create new OTP
    const [newOtp] = await db.insert(otps).values(otp).returning();
    return newOtp;
  }

  async getOtpByPhone(phone: string): Promise<Otp | undefined> {
    const [otp] = await db.select().from(otps).where(eq(otps.phone, phone));
    return otp;
  }

  async verifyOtp(phone: string, otpValue: string): Promise<boolean> {
    const [otp] = await db.select().from(otps).where(eq(otps.phone, phone));
    
    if (!otp) return false;
    
    // Check if OTP matches and is not expired
    const isValid = otp.otp === otpValue && new Date() < otp.expiresAt;
    
    if (isValid) {
      // Delete the OTP after successful verification
      await db.delete(otps).where(eq(otps.id, otp.id));
    }
    
    return isValid;
  }

  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  // Partner Statistics methods
  async getPartnerStatsByDateRange(partnerId: number, startDate: Date, endDate: Date): Promise<PartnerStat[]> {
    return db
      .select()
      .from(partnerStats)
      .where(
        and(
          eq(partnerStats.partnerId, partnerId),
          sql`${partnerStats.date}::date >= ${startDate.toISOString()}::date`,
          sql`${partnerStats.date}::date <= ${endDate.toISOString()}::date`
        )
      )
      .orderBy(asc(partnerStats.date));
  }

  async createOrUpdatePartnerStats(stats: InsertPartnerStat): Promise<PartnerStat> {
    // Format the date as a string (YYYY-MM-DD) for consistent comparison
    const dateString = stats.date instanceof Date 
      ? stats.date.toISOString().split('T')[0] 
      : stats.date;
    
    // Check if stats for this date already exist
    const [existingStat] = await db
      .select()
      .from(partnerStats)
      .where(
        and(
          eq(partnerStats.partnerId, stats.partnerId),
          sql`${partnerStats.date}::date = ${dateString}::date`
        )
      );
    
    if (existingStat) {
      // Update existing stats
      const [updatedStat] = await db
        .update(partnerStats)
        .set(stats)
        .where(
          and(
            eq(partnerStats.partnerId, stats.partnerId),
            sql`${partnerStats.date}::date = ${dateString}::date`
          )
        )
        .returning();
      return updatedStat;
    } else {
      // Create new stats
      const [newStat] = await db
        .insert(partnerStats)
        .values(stats)
        .returning();
      return newStat;
    }
  }

  async incrementStoreViews(partnerId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateString = today.toISOString().split('T')[0];
    
    const [existingStat] = await db
      .select()
      .from(partnerStats)
      .where(
        and(
          eq(partnerStats.partnerId, partnerId),
          sql`${partnerStats.date}::date = ${dateString}::date`
        )
      );
    
    if (existingStat) {
      const currentViews = existingStat.storeViews || 0;
      await db
        .update(partnerStats)
        .set({
          storeViews: currentViews + 1
        })
        .where(
          and(
            eq(partnerStats.partnerId, partnerId),
            sql`${partnerStats.date}::date = ${dateString}::date`
          )
        );
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
    const dateString = today.toISOString().split('T')[0];
    
    const [existingStat] = await db
      .select()
      .from(partnerStats)
      .where(
        and(
          eq(partnerStats.partnerId, partnerId),
          sql`${partnerStats.date}::date = ${dateString}::date`
        )
      );
    
    if (existingStat) {
      const currentViews = existingStat.dealViews || 0;
      await db
        .update(partnerStats)
        .set({
          dealViews: currentViews + 1
        })
        .where(
          and(
            eq(partnerStats.partnerId, partnerId),
            sql`${partnerStats.date}::date = ${dateString}::date`
          )
        );
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
    const dateString = today.toISOString().split('T')[0];
    
    const [existingStat] = await db
      .select()
      .from(partnerStats)
      .where(
        and(
          eq(partnerStats.partnerId, partnerId),
          sql`${partnerStats.date}::date = ${dateString}::date`
        )
      );
    
    if (existingStat) {
      const currentScheduled = existingStat.scheduledVisits || 0;
      await db
        .update(partnerStats)
        .set({
          scheduledVisits: currentScheduled + 1
        })
        .where(
          and(
            eq(partnerStats.partnerId, partnerId),
            sql`${partnerStats.date}::date = ${dateString}::date`
          )
        );
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
    const dateString = today.toISOString().split('T')[0];
    
    const [existingStat] = await db
      .select()
      .from(partnerStats)
      .where(
        and(
          eq(partnerStats.partnerId, partnerId),
          sql`${partnerStats.date}::date = ${dateString}::date`
        )
      );
    
    if (existingStat) {
      const currentActual = existingStat.actualVisits || 0;
      await db
        .update(partnerStats)
        .set({
          actualVisits: currentActual + 1
        })
        .where(
          and(
            eq(partnerStats.partnerId, partnerId),
            sql`${partnerStats.date}::date = ${dateString}::date`
          )
        );
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

export const storage = new DatabaseStorage();
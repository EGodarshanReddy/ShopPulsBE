import { storage } from "../storage";
import { InsertOtp } from "@shared/schema";

// Mock OTP generation for development
export async function generateAndSendOTP(phone: string): Promise<string> {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiration time to 10 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  
  // Store OTP in database
  const otpData: InsertOtp = {
    phone,
    otp,
    expiresAt,
  };
  
  await storage.createOtp(otpData);
  
  // In a real implementation, this would send an SMS via Twilio or similar service
  // For development, we'll just log the OTP
  console.log(`OTP for ${phone}: ${otp}`);
  
  return otp;
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  return await storage.verifyOtp(phone, otp);
}

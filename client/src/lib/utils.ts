import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function calculateTimeLeft(date: string | Date): string {
  const endDate = new Date(date);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return "Expired";
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""}`;
  }
  
  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "?";
  
  const first = firstName ? firstName.charAt(0).toUpperCase() : "";
  const last = lastName ? lastName.charAt(0).toUpperCase() : "";
  
  return `${first}${last}`;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return `+${phone.substring(0, 2)} ••• ••• ${phone.substring(phone.length - 4)}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function calculatePointsProgress(points: number): number {
  // Calculate progress towards next reward threshold (500 points)
  const remainder = points % 500;
  return (remainder / 500) * 100;
}

export function getPointsForNextReward(points: number): number {
  // Calculate points needed for next reward threshold (500 points)
  const remainder = points % 500;
  return 500 - remainder;
}

export function calculateRedemptionValue(points: number): number {
  // 100 points = ₹10
  return Math.floor(points / 100) * 10;
}

import { cn } from "@/lib/utils";

interface PriceRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceRating({ 
  rating, 
  max = 5, 
  size = "md",
  className 
}: PriceRatingProps) {
  // Size variants
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-md"
  };
  
  return (
    <div className={cn("flex", className)}>
      {Array.from({ length: max }).map((_, index) => (
        <span 
          key={index}
          className={cn(
            "material-icons",
            sizeClasses[size],
            index < rating ? "text-accent" : "text-neutral-300"
          )}
        >
          ₹
        </span>
      ))}
    </div>
  );
}

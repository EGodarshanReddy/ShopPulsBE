import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface BottomNavigationProps {
  items: NavItem[];
  className?: string;
}

export function BottomNavigation({ items, className }: BottomNavigationProps) {
  const [location] = useLocation();
  
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-card backdrop-blur-md px-4 py-3 z-20 border-t",
      className
    )}>
      <div className="flex justify-around">
        {items.map((item) => {
          const isActive = location === item.path;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex flex-col items-center py-2 px-4 transition-all relative",
                isActive 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span 
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full" 
                  style={{background: "linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))"}}
                />
              )}
              <span className="material-icons text-lg">{item.icon}</span>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

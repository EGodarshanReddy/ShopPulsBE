import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BUSINESS_CATEGORIES } from "@/lib/constants";

interface CategorySelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  multiSelect?: boolean;
  className?: string;
}

export function CategorySelector({
  selectedCategories,
  onChange,
  multiSelect = true,
  className
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<string[]>(BUSINESS_CATEGORIES);
  
  const toggleCategory = (category: string) => {
    if (multiSelect) {
      // For multi-select, toggle the category selection
      if (selectedCategories.includes(category)) {
        onChange(selectedCategories.filter(c => c !== category));
      } else {
        onChange([...selectedCategories, category]);
      }
    } else {
      // For single select, replace the selected category
      onChange([category]);
    }
  };
  
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((category) => (
        <div
          key={category}
          onClick={() => toggleCategory(category)}
          className={cn(
            "category-pill cursor-pointer px-4 py-2 rounded-full text-sm transition-colors",
            selectedCategories.includes(category)
              ? "bg-primary text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          )}
        >
          {category}
        </div>
      ))}
    </div>
  );
}

export function CategoryFilterSelector({
  selectedCategory,
  onChange,
  includeAll = true,
  className
}: {
  selectedCategory: string | null;
  onChange: (category: string | null) => void;
  includeAll?: boolean;
  className?: string;
}) {
  const categories = includeAll 
    ? ["All", ...BUSINESS_CATEGORIES]
    : [...BUSINESS_CATEGORIES];
  
  return (
    <div className={cn("flex overflow-x-auto py-2 space-x-3 no-scrollbar", className)}>
      {categories.map((category) => (
        <div
          key={category}
          onClick={() => onChange(category === "All" ? null : category)}
          className={cn(
            "category-pill flex-shrink-0 cursor-pointer px-4 py-2 rounded-full text-sm",
            (category === "All" && selectedCategory === null) || category === selectedCategory
              ? "bg-primary text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          )}
        >
          {category}
        </div>
      ))}
    </div>
  );
}

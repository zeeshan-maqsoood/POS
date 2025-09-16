'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MenuCategoriesProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function MenuCategories({ categories, selectedCategory, onSelectCategory }: MenuCategoriesProps) {
  console.log(categories,"categories")
  const scrollContainer = useRef<HTMLDivElement>(null);

  const scroll = (scrollOffset: number) => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollLeft += scrollOffset;
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-10">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white"
          onClick={() => scroll(-200)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div 
        ref={scrollContainer}
        className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide px-8"
        style={{ scrollBehavior: 'smooth' }}
      >
        {categories.map((category) => (
          <button
            key={category}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
              selectedCategory === category
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
              "min-w-[100px] flex-shrink-0 flex justify-center"
            )}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="absolute right-0 top-0 bottom-0 flex items-center z-10">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white"
          onClick={() => scroll(200)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  imageUrl?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  menuItems?: any[];
}

interface MenuCategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
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

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => scroll(-200)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div
          ref={scrollContainer}
          className="flex space-x-2 overflow-x-auto scrollbar-hide"
        >
          <Button
            variant={selectedCategory === 'All' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'whitespace-nowrap',
              selectedCategory === 'All' ? 'bg-primary text-primary-foreground' : ''
            )}
            onClick={() => onSelectCategory('All')}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'whitespace-nowrap',
                selectedCategory === category.id ? 'bg-primary text-primary-foreground' : ''
              )}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
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

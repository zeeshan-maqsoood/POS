'use client';

import { MenuItem } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItemsProps {
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export function MenuItems({ menuItems: items, onAddToCart }: MenuItemsProps) {
  console.log(items,"items")
  if (items.length === 0) {
    return (
      <div className="col-span-full flex items-center justify-center h-32 text-muted-foreground">
        No items found in this category.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="group relative flex flex-col h-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
        >
          <div className="h-48 bg-muted/50 flex items-center justify-center overflow-hidden">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="text-muted-foreground/30">
                <svg 
                  className="w-16 h-16" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="1" 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <div className="flex-grow">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-lg line-clamp-2">{item.name}</h3>
                <span className="font-semibold whitespace-nowrap text-primary">
                  ${item.price.toFixed(2)}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {item.category}
              </p>
            </div>
            <Button 
              size="sm" 
              className="mt-4 w-full group-hover:bg-primary/90 transition-colors"
              onClick={() => onAddToCart(item)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add to Order
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

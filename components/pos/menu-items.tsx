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
    <>
      {items.map((item) => (
        <div 
          key={item.id} 
          className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
        >
          <div className="aspect-video bg-muted/50 flex items-center justify-center">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="text-muted-foreground/30">
                <svg 
                  className="w-12 h-12" 
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
                  ></path>
                </svg>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold leading-tight">{item.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.category}
                </p>
              </div>
              <span className="font-semibold whitespace-nowrap">
              £{(Number(item.price) * (1 + Number(item.taxRate) / 100)).toFixed(2)}
              </span>
            </div>
            <Button 
              size="sm" 
              className="mt-3 w-full group-hover:bg-primary/90"
              onClick={() => onAddToCart(item)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add to Order
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

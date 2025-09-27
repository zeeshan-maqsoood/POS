'use client';

import { useState, useEffect } from 'react';
import { MenuItem, CartItemModifier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ModifierDialogProps {
  item: MenuItem;
  modifiers: CartItemModifier[];
  onClose: () => void;
  onAddToCart: (item: MenuItem, modifiers: CartItemModifier[]) => void;
}

export function ModifierDialog({ item, modifiers: availableModifiers, onClose, onAddToCart }: ModifierDialogProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<CartItemModifier[]>([]);
  
  // Calculate item total with selected modifiers
  const calculateTotal = () => {
    const basePrice = item.price || 0;
    const modifiersTotal = selectedModifiers.reduce((sum, mod) => sum + (mod.price || 0), 0);
    return basePrice + modifiersTotal;
  };

  // Toggle modifier selection
  const toggleModifier = (modifier: CartItemModifier) => {
    setSelectedModifiers(prev => {
      const existingIndex = prev.findIndex(m => m.id === modifier.id);
      if (existingIndex >= 0) {
        return prev.filter((_, idx) => idx !== existingIndex);
      }
      return [...prev, modifier];
    });
  };

  // Handle add to cart with selected modifiers
  const handleAddToCart = () => {
    onAddToCart(item, selectedModifiers);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Customize {item.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {availableModifiers.map(modifier => (
            <div 
              key={modifier.id}
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedModifiers.some(m => m.id === modifier.id) 
                  ? 'border-primary bg-primary/10' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleModifier(modifier)}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                  selectedModifiers.some(m => m.id === modifier.id) 
                    ? 'bg-primary border-primary' 
                    : 'border-gray-300'
                }`}>
                  {selectedModifiers.some(m => m.id === modifier.id) && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
                <span>{modifier.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                +{formatCurrency(modifier.price)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Item Price</p>
            <p className="font-semibold">{formatCurrency(item.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Modifiers</p>
            <p className="font-semibold">
              {selectedModifiers.length > 0 
                ? `+${formatCurrency(selectedModifiers.reduce((sum, mod) => sum + mod.price, 0))}` 
                : 'None'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-semibold text-lg">
              {formatCurrency(calculateTotal())}
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddToCart}
            disabled={item.modifierGroupIds?.length > 0 && selectedModifiers.length === 0}
          >
            Add to Order
          </Button>
        </div>
      </div>
    </div>
  );
}

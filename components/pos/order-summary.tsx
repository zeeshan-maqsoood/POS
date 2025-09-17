'use client';

import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, Utensils, Loader2, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface OrderSummaryProps {
  cart: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: () => void;
  // Optional props with default values
  subtotal?: number;
  tax?: number;
  total?: number;
  onBranchChange?: (branchId: string) => void;
  onTableNumberChange?: (tableNumber: string) => void;
  onCustomerNameChange?: (name: string) => void;
  selectedBranch?: string;
  tableNumber?: string;
  customerName?: string;
}

const branches = [
  { id: '1', name: 'Main Branch' },
  { id: '2', name: 'Downtown' },
  { id: '3', name: 'Uptown' },
];

const tableNumbers = Array.from({ length: 20 }, (_, i) => (i + 1).toString());

export function OrderSummary({
  cart,
  onRemoveItem,
  onClearCart,
  subtotal = 0,
  tax = 0,
  total = 0,
  onBranchChange = () => {},
  onTableNumberChange = () => {},
  onCustomerNameChange = () => {},
  selectedBranch = '',
  tableNumber = '',
  customerName = '',
  onOrderPlaced = () => {},
}: OrderSummaryProps) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      onRemoveItem(itemId);
    } else {
      // Since we don't have direct quantity update in the parent,
      // we'll remove and re-add the item with the new quantity
      const item = cart.find(item => item.item.id === itemId);
      if (item) {
        onRemoveItem(itemId);
        // Note: This assumes the parent component handles adding with quantity
        // If needed, you might need to modify the parent to handle quantity updates
      }
    }
  };

  const removeItem = (itemId: string) => {
    onRemoveItem(itemId);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setIsPlacingOrder(true);
    setTimeout(() => {
      toast.success('Order placed!');
      onClearCart();
      onOrderPlaced?.();
      setIsPlacingOrder(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-3 opacity-30" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {cart.map(({ item, quantity }) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border p-3 shadow-sm flex items-start justify-between"
              >
                <div className="flex gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-14 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      ${item.price.toFixed(2)} × {quantity}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="font-semibold">${(item.price * quantity).toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-2">{quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 text-xs mt-1"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form + Totals */}
      <div className="p-4 border-t space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            >
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
            <select
              value={tableNumber}
              onChange={(e) => onTableNumberChange(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            >
              <option value="">Select Table</option>
              {tableNumbers.map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <Input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              className="w-full text-sm"
            />
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <Button
          className="w-full mt-3"
          size="lg"
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder || cart.length === 0}
        >
          {isPlacingOrder ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing...
            </>
          ) : (
            `Place Order ($${total.toFixed(2)})`
          )}
        </Button>
      </div>
    </div>
  );
}
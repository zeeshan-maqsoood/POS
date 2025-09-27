
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, Utensils, Loader2, ShoppingCart, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import PermissionGate from '@/components/auth/permission-gate';
import orderApi, { PaymentMethod, OrderStatus } from '@/lib/order-api';
import { useSocket } from '@/contexts/SocketContext';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CartItem, CartItemModifier } from '@/lib/types';
import { ReceiptTemplate } from '../receipt/receipt-template';
import { usePrintReceipt } from '@/hooks/use-print-receipt';
import { ReceiptButton } from '../receipt/receipt-button';
import { format } from 'date-fns';

interface OrderSummaryProps {
  cart: CartItem[];
  onUpdateCart: (items: CartItem[]) => void;
  onClearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  onBranchChange: (branchId: string) => void;
  onTableNumberChange: (tableNumber: string) => void;
  onCustomerNameChange: (name: string) => void;
  selectedBranch: string | null;
  tableNumber: string;
  customerName: string;
  onOrderPlaced?: (orderId?: string) => void;
  userBranch?: string; // Add user branch to filter available branches
}

const branches = [
  { id: 'Main Branch', name: 'Main Branch' },
  { id: 'Downtown Branch', name: 'Downtown Branch' },
  { id: 'Uptown Branch', name: 'Uptown Branch' },
  { id: 'Westside Branch', name: 'Westside Branch' },
  { id: 'Eastside Branch', name: 'Eastside Branch' }
];



const tableNumbers = Array.from({ length: 20 }, (_, i) => (i + 1).toString());

export function OrderSummary({
  cart,
  onUpdateCart,
  onClearCart,
  subtotal,
  tax,
  total,
  onBranchChange,
  onTableNumberChange,
  onCustomerNameChange,
  selectedBranch,
  tableNumber,
  customerName,
  onOrderPlaced,
  userBranch, // Add userBranch parameter
}: OrderSummaryProps) {
  // Filter branches based on user's assigned branch
  const { socket } = useSocket()
  const availableBranches = userBranch
    ? branches.filter(branch => branch.id === userBranch)
    : branches;

  // If user has a branch but it's not in the available branches, add it
  const finalBranches = userBranch && availableBranches.length === 0
    ? [{ id: userBranch, name: userBranch }]
    : availableBranches;
    
  // Get user role from local storage or context
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'CASHIER' : 'CASHIER';
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    id: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      total: number;
      tax: number;
      notes?: string | null;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    createdAt: Date;
    customerName?: string | null;
    tableNumber?: string | null;
    branchName: string;
  } | null>(null);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const { printReceipt, isPrinting } = usePrintReceipt();

  const updateQuantity = (itemId: string, newQuantity: number, modifiers: CartItemModifier[] = []) => {
    if (newQuantity < 1) {
      onUpdateCart(cart.filter(item => item.item.id !== itemId));
    } else {
      onUpdateCart(
        cart.map(item => {
          if (item.item.id === itemId) {
            const selectedModifiersPrice = item.modifiers
              ?.filter(m => m.selected)
              .reduce((sum, mod) => sum + mod.price, 0) || 0;
            
            return { 
              ...item, 
              quantity: newQuantity,
              totalPrice: (item.basePrice + selectedModifiersPrice) * newQuantity
            };
          }
          return item;
        })
      );
    }
  };

  const toggleModifier = (itemId: string, modifier: CartItemModifier) => {
    onUpdateCart(
      cart.map(item => {
        if (item.item.id === itemId && item.modifiers) {
          const updatedModifiers = item.modifiers.map(m => 
            m.id === modifier.id ? { ...m, selected: !m.selected } : m
          );
          
          const selectedModifiersPrice = updatedModifiers
            .filter(m => m.selected)
            .reduce((sum, mod) => sum + mod.price, 0);
          
          return {
            ...item,
            modifiers: updatedModifiers,
            totalPrice: (item.basePrice + selectedModifiersPrice) * item.quantity
          };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string, modifiers: CartItemModifier[] = []) => {
    if (modifiers.length === 0) {
      onUpdateCart(cart.filter(item => item.item.id !== itemId));
    } else {
      onUpdateCart(
        cart.filter(cartItem => {
          if (cartItem.item.id !== itemId) return true;
          if (cartItem.modifiers?.length !== modifiers.length) return true;
          return !modifiers.every(mod => 
            cartItem.modifiers?.some(m => m.id === mod.id)
          );
        })
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    try {
      setIsPlacingOrder(true);
      const items = cart.map(({ item, quantity }) => ({
        menuItemId: item.id,
        quantity,
        name: item.name,
        price: item.price,
      }));

      const payload = {
        tableNumber: tableNumber || undefined,
        customerName: customerName || undefined,
        items,
        paymentMethod: PaymentMethod.CASH as PaymentMethod,
        branchName: selectedBranch || undefined,
        subtotal,
        tax,
        total,
        status: OrderStatus.PENDING as OrderStatus,
        notes: '',
      } as const;



      const res = await orderApi.createOrder(payload as any);
      if (res?.data?.data) {
        // Don't show success toast here as it will be handled by the WebSocket notification
        // The WebSocket notification will show the success message with order details
        if (socket) {
          socket.emit('new-order', { 
            order: { ...payload, branchId: selectedBranch },
            createdByRole: userRole
          });
        }
        onClearCart();
        onOrderPlaced?.(res.data.data.id);
      } else {
        toast.error('Failed to place order');
      }
    } catch (e: any) {
      console.error('Place order error:', e);
      toast.error(e?.response?.data?.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Calculate item total including selected modifiers
  const calculateItemTotal = (item: CartItem) => {
    const selectedModifiersPrice = item.modifiers
      ?.filter(m => m.selected !== false)
      .reduce((sum, mod) => sum + mod.price, 0) || 0;
    
    return (item.basePrice + selectedModifiersPrice) * item.quantity;
  };

  // Calculate order totals
  const orderSubtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const orderTax = orderSubtotal * tax;
  const orderTotal = orderSubtotal + orderTax;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cart Items */}
      <div className="p-3 space-y-3 md:flex-1 md:overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-3 opacity-30" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          cart.map(({ item, quantity }) => (
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
                  £{item.price.toFixed(2)} × {quantity}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="font-semibold">
                  £{(item.price * quantity).toFixed(2)}
                </p>
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
          ))
        )}
      </div>

      {/* Form + Totals */}
      {/* Hidden receipt for printing */}
      <div className="hidden">
        <div ref={receiptRef}>
          {lastOrder && (
            <ReceiptTemplate 
              order={{
                ...lastOrder,
                orderNumber: `ORD-${lastOrder.id.slice(0, 8).toUpperCase()}`,
                status: 'COMPLETED',
                paymentMethod: 'CASH',
                createdAt: new Date(),
              }}
              companyInfo={{
                name: 'Restaurant POS',
                address: '123 Main St, City, Country',
                phone: '+1 234 567 8900',
                website: 'restaurant.com',
              }}
            />
          )}
        </div>
      </div>

      <div className="p-4 border-t space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Branch</label>
            {finalBranches.length === 0 ? (
              <div className="w-full p-2 border rounded-md bg-gray-50 text-gray-500 text-sm">
                No branch assigned
              </div>
            ) : (
              <Select
                value={selectedBranch || ''}
                onValueChange={onBranchChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {finalBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Table</label>
            <Select
              value={tableNumber}
              onValueChange={onTableNumberChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tableNumbers.map(num => (
                  <SelectItem key={num} value={num}>
                    Table {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <span>£{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>£{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>£{total.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <PermissionGate required={["ORDER_CREATE","POS_UPDATE"]} disableInsteadOfHide>
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
                `Place Order ( £${total.toFixed(2)})`
              )}
            </Button>
          </PermissionGate>

          {lastOrder && (
            <ReceiptButton
              onPrint={printReceipt}
              isPrinting={isPrinting}
              variant="outline"
              className="w-full"
              label={isPrinting ? 'Printing Receipt...' : 'Print Receipt Again'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
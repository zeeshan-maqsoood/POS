'use client';

import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, Utensils, Loader2, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import PermissionGate from '@/components/auth/permission-gate';
import { useState, useEffect, useRef, useMemo } from 'react';
import { orderApi, PaymentMethod, OrderStatus, OrderType } from '@/lib/order-api';
import { useSocket } from '@/contexts/SocketContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CartItem } from '@/lib/types';
import { ReceiptTemplate } from '../receipt/receipt-template';
import { usePrintReceipt } from '@/hooks/use-print-receipt';
import { ReceiptButton } from '../receipt/receipt-button';

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
  userBranch?: string;
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  occupiedTables?: Set<string>;
  isEditMode?: boolean;
  editOrderData?: any;
}

const branches = [
  { id: 'Bradford', name: 'Bradford' },
  { id: 'Leeds', name: 'Leeds' },
  { id: 'Darley St Market', name: 'Darley St Market' },
  { id: 'Helifax', name: 'Helifax' },
];

const tableNumbers = Array.from({ length: 20 }, (_, i) => (i + 1).toString());

export function OrderSummary({
  cart,
  onUpdateCart,
  onClearCart,
  subtotal = 0,
  tax = 0,
  total = 0,
  onBranchChange,
  onTableNumberChange,
  onCustomerNameChange,
  selectedBranch,
  tableNumber,
  customerName,
  onOrderPlaced,
  userBranch,
  orderType = 'DINE_IN',
  onOrderTypeChange,
  occupiedTables = new Set(),
  isEditMode = false,
  editOrderData,
}: OrderSummaryProps) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const userRole =
    typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'CASHIER' : 'CASHIER';
  const { printReceipt } = usePrintReceipt();

  // Initialize form when editing order
  useEffect(() => {
    if (isEditMode && editOrderData) {
      const orderType = editOrderData.data.orderType || 'DINE_IN';
      onOrderTypeChange(orderType);

      const branchToSelect =
        editOrderData.data.branchName || userBranch || (branches.length > 0 ? branches[0].id : null);
      if (branchToSelect) {
        onBranchChange(branchToSelect);
      }

      onCustomerNameChange(editOrderData.data.customerName || '');

      if (orderType === 'DINE_IN' && editOrderData.data.tableNumber) {
        onTableNumberChange(editOrderData.data.tableNumber.toString());
      }
      console.log(editOrderData,"editOrderData")

      if (editOrderData.data.items && editOrderData.data.items.length > 0) {
        const cartItems = editOrderData.data.items.map(
          (item: { menuItemId: any; name: any; price: any; quantity: any,ImageUrl:any }) => ({
            item: {
              id: item.menuItemId,
              name: item.name || `Item ${item.menuItemId}`,
              price: item.price || 0,
              description: '',
              categoryId: '',
              isActive: true,
              imageUrl: item.ImageUrl || '',
              modifiers: [],
            },
            quantity: item.quantity || 1,
          })
        );
        onUpdateCart(cartItems);
      }
    }

    setIsMounted(true);

    return () => {
      if (isEditMode) {
        onUpdateCart([]);
        onOrderTypeChange('DINE_IN');
        onBranchChange('');
        onCustomerNameChange('');
        onTableNumberChange('');
      }
    };
  }, [
    isEditMode,
    editOrderData,
    onBranchChange,
    onTableNumberChange,
    onCustomerNameChange,
    onOrderTypeChange,
    onUpdateCart,
    userBranch,
  ]);

  const finalBranches = useMemo(
    () => (userBranch ? branches.filter((branch) => branch.id === userBranch) : branches),
    [userBranch]
  );

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = cart.map((item) =>
      item.item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    onUpdateCart(updatedCart);
  };  
  console.log(cart,"cart");

  const removeItem = (itemId: string) => {
    onUpdateCart(cart.filter((item) => item.item.id !== itemId));
  };

  // const handlePlaceOrder = async () => {
  //   // ✅ Update order
  //   if (isEditMode && editOrderData?.id) {
  //     try {
  //       setIsPlacingOrder(true);
  //       const items = cart.map(({ item, quantity }) => ({
  //         menuItemId: item.id,
  //         quantity,
  //         name: item.name,
  //         price: item.price,
  //       }));

  //       const payload = {
  //         tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
  //         customerName: customerName || null,
  //         items,
  //         branchName: selectedBranch,
  //         subtotal,
  //         tax,
  //         total,
  //         orderType,
  //         status: OrderStatus.PENDING,
  //       };

  //       const res = await orderApi.updateOrder(editOrderData.id, payload);
  //       if (res?.data?.data) {
  //         toast.success('Order updated successfully!');
  //         onOrderPlaced?.(res.data.data.id);
  //       } else {
  //         toast.error('Failed to update order');
  //       }
  //     } catch (e: any) {
  //       console.error('Update order error:', e);
  //       toast.error(e?.response?.data?.message || 'Failed to update order');
  //     } finally {
  //       setIsPlacingOrder(false);
  //     }
  //     return;
  //   }

  //   // ✅ Create order
  //   if (cart.length === 0) {
  //     toast.error('Your cart is empty');
  //     return;
  //   }
  //   try {
  //     setIsPlacingOrder(true);
  //     const items = cart.map(({ item, quantity }) => ({
  //       menuItemId: item.id,
  //       quantity,
  //       name: item.name,
  //       price: item.price,
  //     }));

  //     const payload = {
  //       tableNumber: tableNumber || undefined,
  //       customerName: customerName || undefined,
  //       items,
  //       paymentMethod: PaymentMethod.CASH,
  //       branchName: selectedBranch || undefined,
  //       subtotal,
  //       tax,
  //       total,
  //       status: OrderStatus.PENDING,
  //       orderType,
  //       notes: '',
  //     } as const;

  //     const res = await orderApi.createOrder(payload as any);
  //     if (res?.data?.data) {
  //       if (socket) {
  //         socket.emit('new-order', {
  //           order: { ...payload, branchId: selectedBranch },
  //           createdByRole: userRole,
  //         });
  //       }
  //       onClearCart();
  //       onOrderPlaced?.(res.data.data.id);
  //     } else {
  //       toast.error('Failed to place order');
  //     }
  //   } catch (e: any) {
  //     console.error('Place order error:', e);
  //     toast.error(e?.response?.data?.message || 'Failed to place order');
  //   } finally {
  //     setIsPlacingOrder(false);
  //   }
  // };

  const handlePlaceOrder = async () => {
    if (!selectedBranch) {
      toast.error('Please select a branch');
      return;
    }
  
    if (orderType === 'DINE_IN' && !tableNumber) {
      toast.error('Please enter a table number');
      return;
    }
  
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
  
    try {
      setIsPlacingOrder(true);
      console.log('Edit mode:', isEditMode, 'Order ID:', editOrderData?.id);
      
      // Map the cart items to the format expected by the API
      const items = cart.map(({ item, quantity }) => ({
        menuItemId: item.id,
        quantity,
        name: item.name,
        price: item.price,
      }));
  
      const payload = {
        tableNumber: tableNumber || undefined,
        customerName: customerName || undefined,
        items, // Make sure this includes all items including any new ones
        paymentMethod: PaymentMethod.CASH,
        branchName: selectedBranch,
        subtotal,
        tax,
        total,
        status: OrderStatus.PENDING,
        orderType,
        notes: '',
      };
  
      console.log('Payload being sent:', JSON.stringify(payload, null, 2)); // Debug log
  
      let response;
      if (isEditMode && editOrderData?.data?.id) {
        console.log('Updating order with ID:', editOrderData.data.id);
        
        // Prepare the items array without any ID field
        const updatePayload = {
          ...payload,
          items: items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            name: item.name,
            price: item.price
          }))
        };
      
        console.log('Update payload with items:', JSON.stringify(updatePayload, null, 2));
        
        // For update, we need to send the full order data including items to be updated
        response = await orderApi.updateOrder(editOrderData.data.id, updatePayload);
      }else {
        console.log('Creating new order');
        response = await orderApi.createOrder(payload);
      }
  
      if (response?.data?.data) {
        if (socket) {
          socket.emit('new-order', {
            order: { ...payload, branchId: selectedBranch },
            createdByRole: userRole,
          });
        }
        onClearCart();
        onOrderPlaced?.(response.data.data.id);
        toast.success(
          isEditMode ? 'Order updated successfully' : 'Order placed successfully'
        );
      } else {
        throw new Error('Failed to process order');
      }
    } catch (e: any) {
      console.error('Order error:', e);
      toast.error(
        e?.response?.data?.message || 
        `Failed to ${isEditMode ? 'update' : 'place'} order`
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

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
                <div className="relative w-14 h-14">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl.startsWith('http') 
                        ? item.imageUrl 
                        : `/${item.imageUrl.replace(/^\/+/, '')}`
                      }
                      alt={item.name}
                      className="w-full h-full rounded-md object-cover"
                      onError={(e) => {
                        // If image fails to load, show the placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <div className={`${item.imageUrl ? 'hidden' : ''} absolute inset-0 w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center`}>
                    <Utensils className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    £{item.price.toFixed(2)} × {quantity}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="font-semibold">£{(item.price * quantity).toFixed(2)}</p>
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

      {/* Hidden receipt */}
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

      {/* Form + Totals */}
      <div className="p-4 border-t space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Branch */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Branch</label>
            {isEditMode ? (
              <Input
                value={editOrderData?.data?.branchName || ''}
                disabled
                className="bg-gray-100"
              />
            ) : finalBranches.length === 0 ? (
              <div className="w-full p-2 border rounded-md bg-gray-50 text-gray-500 text-sm">
                No branch assigned
              </div>
            ) : (
              <Select value={selectedBranch || ''} onValueChange={onBranchChange}>
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

          {/* Table */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Table</label>
            {isEditMode ? (
              <Input value={tableNumber || 'N/A'} disabled className="bg-gray-100" />
            ) : (
              <Select
                onValueChange={onTableNumberChange}
                value={tableNumber}
                disabled={orderType === 'TAKEAWAY'}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tableNumbers.map((num) => {
                    const isOccupied =
                      (occupiedTables as Set<string>).has(num) && num !== tableNumber;
                    return (
                      <SelectItem
                        key={num}
                        value={num}
                        disabled={isOccupied}
                        className={isOccupied ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        {isOccupied ? `Table ${num} (Occupied)` : `Table ${num}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Customer */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <Input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Order Type */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Order Type</label>
            <Select
              value={orderType}
              onValueChange={(value: string) => {
                if (value !== orderType) {
                  onOrderTypeChange(value as OrderType);
                }
              }}
              disabled={!isEditMode}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DINE_IN">Dine In</SelectItem>
                <SelectItem value="TAKEAWAY">Take Away</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>£{(subtotal || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>£{(tax || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>£{(total || 0).toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <PermissionGate required={['ORDER_CREATE', 'POS_UPDATE']} disableInsteadOfHide>
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
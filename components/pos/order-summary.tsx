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
import { CartItem, MenuItem } from '@/lib/types';
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
  menuItems?: MenuItem[];
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
  menuItems,
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
      console.log(editOrderData, "editOrderData")

      if (editOrderData.data.items && editOrderData.data.items.length > 0) {
        const updatedCart = editOrderData.data.items.map((item: any) => {
          const matchedItem = menuItems?.find((menuItem: MenuItem) => 
            menuItem.id === item.menuItemId
          );
          const modifiersTotal = (item.modifiers || []).reduce(
            (sum: number, mod: any) => sum + (Number(mod.price) || 0), 
            0
          );
          const basePrice = (Number(item.price) || 0) - modifiersTotal;
          console.log(basePrice,"basePrice")
          // Get the modifier IDs that were selected in the original order
          const selectedModifierIds = new Set(
            (item.modifiers || []).map((m: any) => m.id || m.menuItemModifierId)
          );
          
          // Process modifiers to ensure they have the correct structure
          const modifiers = (matchedItem?.modifiers || []).map((mod: any) => {
            // Check if this modifier was in the original order's modifiers
            const isSelected = Array.from(selectedModifierIds).some(id => 
              id === mod.id || id === mod.menuItemModifierId
            );
            
            return {
              ...mod,
              selected: isSelected,
              price: Number(mod.price || 0),
              tax: Number(mod.tax || 0)
            };
          });
      
          // Get the selected modifiers for the cart item
          const selectedModifiers = modifiers.filter((m: any) => m.selected);
      
          return {
            id: Math.random().toString(36).substr(2, 9),
            item: {
              id: item.menuItemId || item.id,
              name: item.name || matchedItem?.name || 'Unknown Item',
              price: basePrice, // Divide by quantity to get single item price
              description: matchedItem?.description ?? '',
              categoryId: matchedItem?.categoryId ?? '',
              isActive: true,
              imageUrl: matchedItem?.imageUrl ?? '',
              modifiers: modifiers
            },
            quantity: item.quantity || 1,
            selectedModifiers: selectedModifiers
          };
        });
        
        onUpdateCart(updatedCart);
      
        const cartItems = editOrderData.data.items.map((item: {
          id: any;
          description: string;
          categoryId: string;
          imageUrl: string;
          modifiers: any[];
          menuItemId: any;
          name: any;
          price: any;
          quantity: any;
          ImageUrl: any;
          taxRate: any
        }) => {
          // Find the matching menu item from the menuItems array
          const matchedItem = menuItems?.find(menuItem =>
            menuItem.id === (item.menuItemId || item.id)
          );

          return {
            item: {
              id: item.menuItemId || item.id,
              name: item.name || matchedItem?.name || 'Unknown Item',
              price: Number(item.price) * (1 + Number(item.taxRate) / 100),
              description: item.description ?? matchedItem?.description ?? '',
              categoryId: item.categoryId ?? matchedItem?.categoryId ?? '',
              isActive: true,
              imageUrl: item.imageUrl ?? matchedItem?.imageUrl ?? '',
              modifiers: matchedItem?.modifiers ?? []
            },
            quantity: item.quantity || 1
          };
        });
        // onUpdateCart(cartItems);
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
console.log(cart,"cartItem")
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
console.log(cart,"cart")
  // In the handlePlaceOrder function, update the items mapping:
// Calculate the total price including modifiers
const items = cart.map(({ item, quantity, selectedModifiers = [] }) => {
  
  // Calculate total price of selected modifiers (including their tax)
  const modifiersTotal = selectedModifiers.reduce((sum, mod) => sum + Number(mod.price || 0), 0);
  const itemPrice = Number(item.price) + modifiersTotal;
  console.log(itemPrice,"itemPrice")
  console.log(item.price,"price")
  console.log(selectedModifiers,"selectedModifiers")
  return {
    menuItemId: item.id,
    quantity,
    name: item.name,
    price: itemPrice,  // This is the total price including tax and modifiers
    tax: 0,  // Tax is already included in the price
    modifiers: selectedModifiers.map(m => ({
      id: m.id,
      name: m.name,
      price: Number(m.price || 0)
    }))
  };
});

// Calculate subtotal (sum of all item prices * quantities)
const calculateSubTotal = items.reduce((total, item) => {
  return total + (item.price * item.quantity);
}, 0);

// No additional tax calculation needed since it's included in the prices
const calculateTax = 0;
const calculateTotal = calculateSubTotal;  // Total is the same as subtotal since tax is included

    const payload = {
      tableNumber: tableNumber || undefined,
      customerName: customerName || undefined,
      items,
      paymentMethod: PaymentMethod.CASH,
      branchName: selectedBranch,
      subtotal: calculateSubTotal,
      tax: calculateTax,
      total: calculateTotal,
      status: OrderStatus.PENDING,
      orderType,
      notes: '',
    };

    console.log('Payload being sent:', JSON.stringify(payload, null, 2));

    let response;
    if (isEditMode && editOrderData?.data?.id) {
      console.log('Updating order with ID:', editOrderData.data.id);

      // Prepare the items array with modifiers for update
      const updatePayload = {
        ...payload,
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          tax: item.tax,
          modifiers: item.modifiers // Include modifiers in update payload
        }))
      };

      console.log('Update payload with items:', JSON.stringify(updatePayload, null, 2));
      response = await orderApi.updateOrder(editOrderData.data.id, updatePayload);
    } else {
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
          cart.map(({ item, quantity }) => {
            const itemPrice = Number(item.price);
            const selectedModifiers = item.modifiers?.filter(m => m.selected) || [];
            const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + Number(m.price || 0), 0);
            const totalItemPrice = (itemPrice + modifiersTotal) * quantity;

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border p-3 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 flex-1">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl.startsWith('http')
                            ? item.imageUrl
                            : `/${item.imageUrl.replace(/^\/+/, '')}`
                          }
                          alt={item.name}
                          className="w-full h-full rounded-md object-cover"
                          onError={(e) => {
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

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{item.name}</p>
                        <p className="font-semibold">£{totalItemPrice.toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        £{itemPrice.toFixed(2)} × {quantity}
                      </p>

                      {/* Modifiers Section */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-medium text-gray-500">Modifiers:</p>
                          <div className="space-y-1">
                            {item.modifiers.map((modifier) => (
                              <div key={modifier.id} className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  id={`${item.id}-${modifier.id}`}
                                  checked={modifier.selected || false}
                                  onChange={(e) => {
                                    const updatedCart = cart.map(cartItem => {
                                      if (cartItem.item.id === item.id) {
                                        const updatedModifiers = cartItem.item.modifiers?.map(m =>
                                          m.id === modifier.id
                                            ? { ...m, selected: e.target.checked }
                                            : m
                                        ) || [];
                                  
                                        // Update the selectedModifiers array in the cart item
                                        const selectedModifiers = updatedModifiers
                                          .filter(m => m.selected)
                                          .map(({ id, name, price, selected,tax }) => ({ 
                                            id, 
                                            name, 
                                            price: Number(price || 0)+Number(tax || 0),
                                            selected: true,
                                           
                                          }));
                                  
                                        return {
                                          ...cartItem,
                                          item: {
                                            ...cartItem.item,
                                            modifiers: updatedModifiers
                                          },
                                          selectedModifiers // Add selectedModifiers to the cart item
                                        };
                                      }
                                      console.log(selectedModifiers,"selectedModifiers")
                                      return cartItem;
                                    });
                                    onUpdateCart(updatedCart);
                                  }}

                                  className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />

                                <label
                                  htmlFor={`${item.id}-${modifier.id}`}
                                  className="text-gray-700 cursor-pointer"
                                >
                                  {modifier.name} (+£{Number(modifier.price || 0).toFixed(2)})
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end ml-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.id, quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-2 text-sm">{quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.id, quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 text-xs mt-1 h-6"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
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
        {/* <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>£{(Number(subtotal) +Number(tax) || 0).toFixed(2)}</span>
        </div> */}
        {/* <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>£{(Number(tax) || 0).toFixed(2)}</span>
        </div> */}
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>£{(Number(total) || 0).toFixed(2)}</span>
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
                `Place Order ( £${(Number(total.toFixed(2)) + Number(tax.toFixed(2))).toFixed(2)})`
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
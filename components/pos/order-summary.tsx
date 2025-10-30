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
import { restaurantApi, Restaurant } from '@/lib/restaurant-api';
import { branchApi, Branch } from '@/lib/branch-api';

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
  onRestaurantChange: (restaurantId: string) => void;
  selectedBranch: string | null;
  selectedRestaurant: string;
  tableNumber: string;
  customerName: string;
  onOrderPlaced?: (orderId?: string) => void;
  userBranch?: string;
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  occupiedTables?: Set<string>;
  isLoadingTables?: boolean;
  tableError?: string | null;
  isEditMode?: boolean;
  editOrderData?: any;
  menuItems?: MenuItem[];
  restaurants?: Restaurant[];
  branches?: Branch[];
  filteredBranches?: Branch[];
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
  onRestaurantChange,
  selectedBranch,
  selectedRestaurant,
  tableNumber,
  customerName,
  onOrderPlaced,
  userBranch,
  orderType = 'DINE_IN',
  onOrderTypeChange,
  occupiedTables = new Set(),
  isLoadingTables = false,
  tableError = null,
  isEditMode = false,
  editOrderData,
  menuItems,
  restaurants = [],
  branches = [],
  filteredBranches = [],
}: OrderSummaryProps) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const { printReceipt } = usePrintReceipt();

  // Ensure occupiedTables is always a Set
  const safeOccupiedTables = useMemo(() => {
    if (occupiedTables instanceof Set) {
      return occupiedTables;
    }
    // If it's not a Set (e.g., undefined, null, or wrong type), return empty Set
    return new Set<string>();
  }, [occupiedTables]);

  const userRole =
    typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'CASHIER' : 'CASHIER';

  // Initialize form when editing order
  useEffect(() => {
    if (isEditMode && editOrderData) {
      const orderData = editOrderData.data;
      onOrderTypeChange(orderData.orderType || 'DINE_IN');

      const branchToSelect =
        orderData.branchName || userBranch || (branches.length > 0 ? branches[0].id : null);

      // Find branch by name and get its ID
      const branchByName = branches.find(branch => branch.name === branchToSelect);
      const branchId = branchByName?.id || branchToSelect;

      if (branchId) {
        onBranchChange(branchId);
      }

      onCustomerNameChange(orderData.customerName || '');

      if (orderData.orderType === 'DINE_IN' && orderData.tableNumber) {
        onTableNumberChange(orderData.tableNumber.toString());
      }
      console.log(orderData, 'editOrderData');

      if (orderData.items && orderData.items.length > 0) {
        const updatedCart = orderData.items.map((item: any) => {
          const matchedItem = menuItems?.find((menuItem: MenuItem) => menuItem.id === item.menuItemId);
          const modifiersTotal = (item.modifiers || []).reduce(
            (sum: number, mod: any) => sum + (Number(mod.price) || 0),
            0
          );
          const basePrice = Number(item.price) || 0; // Price includes tax

          const selectedModifierIds = new Set(
            (item.modifiers || []).map((m: any) => m.id || m.menuItemModifierId)
          );

          const modifiers = (matchedItem?.modifiers || []).map((mod: any) => {
            const isSelected = Array.from(selectedModifierIds).some(
              (id) => id === mod.id || id === mod.menuItemModifierId
            );
            return {
              ...mod,
              selected: isSelected,
              price: Number(mod.price || 0),
              tax: Number(mod.tax || 0),
            };
          });

          const selectedModifiers = modifiers.filter((m: any) => m.selected);

          return {
            id: Math.random().toString(36).substr(2, 9),
            item: {
              id: item.menuItemId || item.id,
              name: item.name || matchedItem?.name || 'Unknown Item',
              price: basePrice, // Price includes tax
              description: matchedItem?.description ?? '',
              categoryId: matchedItem?.categoryId ?? '',
              isActive: true,
              imageUrl: matchedItem?.imageUrl ?? '',
              modifiers: modifiers,
            },
            quantity: item.quantity || 1,
            selectedModifiers,
            totalPrice: (basePrice + modifiersTotal) * (item.quantity || 1), // Include modifiers only if selected
            basePrice: basePrice,
            price: basePrice,
            taxRate: Number(item.taxRate) || 0,
          };
        });

        onUpdateCart(updatedCart);
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
    }
  }, [
    isEditMode,
    editOrderData,
    onBranchChange,
    onTableNumberChange,
    onCustomerNameChange,
    onOrderTypeChange,
    onUpdateCart,
    userBranch,
    menuItems,
  ]);

  console.log(cart, 'cartItem');

  const finalBranches = useMemo(
    () => (userBranch ? branches.filter((branch) => branch.id === userBranch) : branches),
    [userBranch, branches]
  );

  const selectedBranchObj = useMemo(
    () => filteredBranches.find((b) => b.id === selectedBranch),
    [filteredBranches, selectedBranch]
  );

  const allowedOrderTypes = useMemo<OrderType[]>(() => {
    if (!selectedBranchObj) return ['DINE_IN'];

    const allowed: OrderType[] = (() => {
      const serviceType = selectedBranchObj.serviceType;

      if (!serviceType) {
        return ['DINE_IN'];
      }

      switch (serviceType) {
        case 'BOTH':
          return ['DINE_IN', 'TAKEAWAY'];
        case 'DINE_IN':
          return ['DINE_IN'];
        case 'TAKE_AWAY':
          return ['TAKEAWAY'];
        default:
          return ['DINE_IN'];
      }
    })();

    return allowed;
  }, [selectedBranchObj]);

  useEffect(() => {
    if (allowedOrderTypes.length > 0 && !allowedOrderTypes.includes(orderType)) {
      onOrderTypeChange(allowedOrderTypes[0]);
    }
  }, [allowedOrderTypes, orderType, onOrderTypeChange]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = cart.map((item) =>
      item.item.id === itemId
        ? {
            ...item,
            quantity: newQuantity,
            totalPrice:
              (Number(item.item.price) +
                (item.selectedModifiers || []).reduce(
                  (sum, mod) => sum + Number(mod.price || 0),
                  0
                )) *
              newQuantity,
          }
        : item
    );
    onUpdateCart(updatedCart);
  };

  const removeItem = (itemId: string) => {
    onUpdateCart(cart.filter((item) => item.item.id !== itemId));
  };

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, { item, quantity, selectedModifiers }) => {
      const modifierTotal = (selectedModifiers || []).reduce(
        (modSum, mod) => modSum + Number(mod.price || 0),
        0
      );
      return sum + (Number(item.price) + modifierTotal) * quantity;
    }, 0);
  }, [cart]);

  const handlePlaceOrder = async () => {
    // Update order
    if (isEditMode && editOrderData?.id) {
      try {
        setIsPlacingOrder(true);
        const items = cart.map(({ item, quantity, selectedModifiers }) => ({
          menuItemId: item.id,
          quantity,
          name: item.name,
          price: Number(item.price), // Price includes tax
          modifiers: (selectedModifiers || []).map((mod) => ({
            id: mod.id,
            name: mod.name,
            price: Number(mod.price),
          })),
        }));

        const payload = {
          tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
          customerName: customerName || null,
          items,
          branchName: (() => {
            // For edit mode, try to get branch name from various sources
            if (isEditMode) {
              // First try to get from editOrderData
              const editBranchName = editOrderData?.data?.branchName || editOrderData?.branchName;
              if (editBranchName) return editBranchName;

              // If we have selectedBranch, get name from filteredBranches or branches
              if (selectedBranch) {
                const branchFromFiltered = filteredBranches?.find(branch => branch.id === selectedBranch);
                if (branchFromFiltered) return branchFromFiltered.name;

                const branchFromAll = branches?.find(branch => branch.id === selectedBranch);
                if (branchFromAll) return branchFromAll.name;
              }

              // If we have branches data, use the first available branch
              if (filteredBranches && filteredBranches.length > 0) {
                return filteredBranches[0].name;
              }
              if (branches && branches.length > 0) {
                return branches[0].name;
              }
            } else {
              // For create mode, get from selected branch
              if (selectedBranch) {
                const branchFromFiltered = filteredBranches?.find(branch => branch.id === selectedBranch);
                if (branchFromFiltered) return branchFromFiltered.name;

                const branchFromAll = branches?.find(branch => branch.id === selectedBranch);
                if (branchFromAll) return branchFromAll.name;
              }
            }

            // Final fallback - should not reach here in normal operation
            return 'Bradford';
          })(),
          restaurantId: selectedRestaurant, // Add restaurantId to the update payload
          subtotal: cartTotal, // Subtotal includes item prices (with tax) and modifiers
          total: cartTotal, // No separate tax
          orderType,
          status: OrderStatus.PENDING,
        };

        console.log('Update order payload:', payload);

        const res = await orderApi.updateOrder(editOrderData.id, payload);
        if (res?.data?.data) {
          toast.success('Order updated successfully!');
          setLastOrder(res.data.data);
          onOrderPlaced?.(res.data.data.id);
        } else {
          toast.error('Failed to update order');
        }
      } catch (e: any) {
        console.error('Update order error:', e);
        toast.error(e?.response?.data?.message || 'Failed to update order');
      } finally {
        setIsPlacingOrder(false);
      }
      return;
    }

    // Create order
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    try {
      setIsPlacingOrder(true);
      const items = cart.map(({ item, quantity, selectedModifiers }) => ({
        menuItemId: item.id,
        quantity,
        name: item.name,
        price: Number(item.price), // Price includes tax
        modifiers: (selectedModifiers || []).map((mod) => ({
          id: mod.id,
          name: mod.name,
          price: Number(mod.price),
        })),
      }));

      const payload = {
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        customerName: customerName || undefined,
        items,
        paymentMethod: PaymentMethod.CASH,
        branchName: (() => {
          // Get branch name from selected branch
          if (selectedBranch) {
            const branchFromFiltered = filteredBranches?.find(branch => branch.id === selectedBranch);
            if (branchFromFiltered) return branchFromFiltered.name;

            const branchFromAll = branches?.find(branch => branch.id === selectedBranch);
            if (branchFromAll) return branchFromAll.name;
          }

          // Fallback to first available branch
          if (filteredBranches && filteredBranches.length > 0) {
            return filteredBranches[0].name;
          }
          if (branches && branches.length > 0) {
            return branches[0].name;
          }

          return 'Bradford';
        })(),
        restaurantId: selectedRestaurant || undefined, // Add restaurantId to the payload
        subtotal: cartTotal, // Subtotal includes item prices (with tax) and modifiers
        total: cartTotal, // No separate tax
        status: OrderStatus.PENDING,
        orderType,
        notes: '',
      } as const;

      console.log('Create order payload:', payload);

      const res = await orderApi.createOrder(payload as any);
      if (res?.data?.data) {
        setLastOrder(res.data.data);
        if (socket) {
          socket.emit('new-order', {
            order: { ...payload, branchId: selectedBranch },
            createdByRole: userRole,
          });
        }
        onClearCart();
        onOrderPlaced?.(res.data.data.id);
        toast.success('Order placed successfully!');
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
          cart.map(({ item, quantity, totalPrice, selectedModifiers }) => {
            return (
              <div key={item.id} className="bg-white rounded-lg border p-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 flex-1">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl.startsWith('http') ? item.imageUrl : `/${item.imageUrl.replace(/^\/+/, '')}`}
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
                      <div
                        className={`${item.imageUrl ? 'hidden' : ''} absolute inset-0 w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center`}
                      >
                        <Utensils className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{item.name}</p>
                        <p className="font-semibold">£{totalPrice.toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        £{Number(item.price || 0).toFixed(2)} × {quantity}
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
                                    const updatedCart = cart.map((cartItem) => {
                                      if (cartItem.item.id === item.id) {
                                        const updatedModifiers = cartItem.item.modifiers?.map((m) =>
                                          m.id === modifier.id ? { ...m, selected: e.target.checked } : m
                                        ) || [];

                                        const selectedModifiersTotal = updatedModifiers
                                          .filter((m) => m.selected)
                                          .reduce((sum, m) => sum + Number(m.price || 0), 0);

                                        const selectedModifiers = updatedModifiers
                                          .filter((m) => m.selected)
                                          .map(({ id, name, price, selected, tax }) => ({
                                            id,
                                            name,
                                            price: Number(price || 0) + Number(tax || 0),
                                            selected: true,
                                          }));

                                        const updatedTotalPrice =
                                          (Number(cartItem.item.price) + selectedModifiersTotal) *
                                          cartItem.quantity;

                                        return {
                                          ...cartItem,
                                          item: {
                                            ...cartItem.item,
                                            modifiers: updatedModifiers,
                                          },
                                          totalPrice: updatedTotalPrice,
                                          selectedModifiers,
                                        };
                                      }
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
          {/* Restaurant */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Restaurant
              {!isEditMode && userBranch && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Assigned to your branch)
                </span>
              )}
            </label>
            {isEditMode ? (
              <Input
                value={restaurants?.find((r) => r.id === selectedRestaurant)?.name || ''}
                disabled
                className="bg-gray-100"
              />
            ) : (
              <Select 
                value={selectedRestaurant} 
                onValueChange={onRestaurantChange}
                disabled={!!userBranch} // Disable if user has an assigned branch
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {(restaurants || []).map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Branch */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Branch
              {!isEditMode && userBranch && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Assigned to you)
                </span>
              )}
            </label>
            {isEditMode ? (
              <Input 
                value={editOrderData?.branchName || editOrderData?.data?.branchName || ''} 
                disabled 
                className="bg-gray-100" 
              />
            ) : filteredBranches.length === 0 ? (
              <div className="w-full p-2 border rounded-md bg-gray-50 text-gray-500 text-sm">
                {userBranch ? userBranch : 'No branch assigned'}
              </div>
            ) : (
              <Select 
                value={selectedBranch || ''} 
                onValueChange={onBranchChange}
                disabled={!!userBranch} // Disable if user has an assigned branch
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {(filteredBranches || []).map((branch) => (
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
              <>
                {tableError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {tableError}
                  </div>
                )}
                <Select
                  onValueChange={onTableNumberChange}
                  value={tableNumber}
                  disabled={orderType === 'TAKEAWAY' || isLoadingTables}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingTables ? 'Loading tables...' : 'Select table'} />
                  </SelectTrigger>
                  <SelectContent>
                    {tableNumbers.map((num) => {
                      const isOccupied = safeOccupiedTables.has(num) && num !== tableNumber;
                      return (
                        <SelectItem
                          key={num}
                          value={num}
                          disabled={isOccupied}
                          className={isOccupied ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {isOccupied
                            ? `Table ${num} (Occupied - ${safeOccupiedTables.has(num) ? 'Payment Pending' : 'Available'})`
                            : `Table ${num}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </>
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
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                {(allowedOrderTypes || []).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'DINE_IN' ? 'Dine In' : 'Take Away'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>£{cartTotal.toFixed(2)}</span>
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
                `Place Order ( £${cartTotal.toFixed(2)})`
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
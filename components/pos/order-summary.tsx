'use client';

import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, Utensils, Loader2, ShoppingCart, Printer, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import PermissionGate from '@/components/auth/permission-gate';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PaymentCalculator } from './payment-calculator';
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
import { restaurantApi, Restaurant } from '@/lib/restaurant-api';
import { branchApi, Branch } from '@/lib/branch-api';
import { PaymentStatus } from '@/lib/order-api';
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
  onOrderPlaced?: (orderId?: string, orderData?: any) => void;
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
  isAdmin?: boolean;
  userRole?: string;
  userRestaurantId?: string | null;
  userBranchId?: string | null;
}

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
  isAdmin = false,
  userRole = 'CASHIER',
  userRestaurantId,
  userBranchId,
}: OrderSummaryProps) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCafe, setIsCafe] = useState(false);
  const { socket } = useSocket();

  const isManager = userRole === 'MANAGER';

  // Auto-select restaurant and branch for managers
  // Check if selected restaurant is a cafe
  useEffect(() => {
    const checkIfCafe = async () => {
      if (selectedRestaurant) {
        try {
          const response = await restaurantApi.getRestaurantById(selectedRestaurant);
console.log(response,"restaurantResponse")
          if (response?.data) {
            setIsCafe(response.data?.data?.businessType === 'CAFE');
          }
        } catch (error) {
          console.error('Error fetching restaurant details:', error);
        }
      }
    };

    checkIfCafe();
  }, [selectedRestaurant]);

  useEffect(() => {
    if (isManager && userRestaurantId && !selectedRestaurant) {
      onRestaurantChange(userRestaurantId);
    }
  }, [isManager, userRestaurantId, selectedRestaurant, onRestaurantChange]);

  useEffect(() => {
    if (isManager && userBranchId && !selectedBranch) {
      onBranchChange(userBranchId);
    }
  }, [isManager, userBranchId, selectedBranch, onBranchChange]);

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

  const handlePaymentComplete = async (amountPaid: number, change: number) => {
    setShowPaymentModal(false);
    await handlePlaceOrder(amountPaid, change);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const handlePlaceOrder = async (amountPaid?: number, change: number = 0) => {
    // Update order
    if (isEditMode && editOrderData?.id) {
      try {
        setIsPlacingOrder(true);
        
        // Get current cart items with modifiers
        const currentItems = cart.map(({ item, quantity, selectedModifiers }) => {
          const modifiers = (selectedModifiers || []).map((mod) => ({
            id: mod.id,
            name: mod.name,
            price: Number(mod.price),
          }));
          
          // Calculate total for this item including modifiers
          const modifierTotal = modifiers.reduce((sum, mod) => sum + Number(mod.price || 0), 0);
          const itemTotal = (Number(item.price) + modifierTotal) * quantity;
          
          return {
            menuItemId: item.id,
            quantity,
            name: item.name,
            price: Number(item.price) + modifierTotal,
            total: itemTotal,
            modifiers,
            isNew: true
          };
        });

        const branchName = isEditMode
          ? (editOrderData?.data?.branchName || (selectedBranch && branches.find(branch => branch.id === selectedBranch)?.name) || '')
          : (selectedBranch && branches.find(branch => branch.id === selectedBranch)?.name) || '';

        // Get the current state of original items
        const originalItems = [...(editOrderData.data?.items || [])];
        
        // Create a map to track original quantities by item ID and modifiers
        const originalItemsMap = new Map();
        originalItems.forEach(item => {
          const key = `${item.menuItemId}-${JSON.stringify(item.modifiers || [])}`;
          originalItemsMap.set(key, item.quantity || 0);
        });
        
        // Find which items are actually new or have increased quantities
        const updatedItems = [];
        const currentItemsMap = new Map();
        
        // First pass: track all current items and their quantities
        currentItems.forEach(item => {
          const key = `${item.menuItemId}-${JSON.stringify(item.modifiers || [])}`;
          currentItemsMap.set(key, (currentItemsMap.get(key) || 0) + (item.quantity || 0));
        });
        
        // Second pass: find items that are new or have increased quantities
        for (const [key, currentQty] of currentItemsMap.entries()) {
          const originalQty = originalItemsMap.get(key) || 0;
          if (currentQty > originalQty) {
            // Find the item in current items to get full details
            const item = currentItems.find(i => 
              `${i.menuItemId}-${JSON.stringify(i.modifiers || [])}` === key
            );
            
            if (item) {
              const quantityDiff = currentQty - originalQty;
              updatedItems.push({
                ...item,
                quantity: quantityDiff,
                total: (item.price || 0) * quantityDiff,
                isNew: true
              });
            }
          }
        }

        const paymentInfo = amountPaid !== undefined ? {
          amountPaid,
          change,
          paymentMethod: PaymentMethod.CASH,
          paymentStatus: 'PAID' as const
        } : {};

        const payload = {
          tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
          customerName: customerName || null,
          items: currentItems,
          branchName,
          restaurantId: selectedRestaurant,
          subtotal: cartTotal,
          total: cartTotal,
          orderType,
          status: amountPaid !== undefined ? OrderStatus.COMPLETED : OrderStatus.PENDING,
          notes: amountPaid !== undefined 
            ? `Paid: ${formatCurrency(amountPaid)}, Change: ${formatCurrency(change)}`
            : '',
          ...paymentInfo,
          _printData: {
            isUpdate: true,
            updatedItems: updatedItems,
            originalItems: originalItems
          }
        };

        // Remove non-order properties before sending to API
        const { _printData, ...orderData } = payload;
        const res = await orderApi.updateOrder(editOrderData.id, orderData);
        if (res?.data?.data) {
          toast.success('Order updated successfully!');
          const updatedOrder = {
            ...res.data.data,
            _printData: payload._printData
          };
          
          setLastOrder(updatedOrder);
          
          // Show print dialog if there are updated items
          if (updatedItems.length > 0) {
            setShowPrintView(true);
          }
          
          onOrderPlaced?.(updatedOrder.id, updatedOrder);
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
        price: Number(item.price),
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
        branchName: (selectedBranch && branches.find(branch => branch.id === selectedBranch)?.name) || '',
        restaurantId: selectedRestaurant || undefined,
        subtotal: cartTotal,
        tax: 0, // Add default tax value
        total: cartTotal,
        status: amountPaid !== undefined ? OrderStatus.COMPLETED : OrderStatus.PENDING,
        orderType,
        notes: amountPaid !== undefined 
          ? `Paid: ${formatCurrency(amountPaid)}, Change: ${formatCurrency(change)}`
          : '',
        paymentStatus: amountPaid !== undefined ? 'PAID' : 'PENDING'
      };
      const res = await orderApi.createOrder(payload);
      if (res?.data?.data) {
        setLastOrder(res.data.data);
        if (socket) {
          socket.emit('new-order', {
            order: { 
              ...payload, 
              branchName: selectedBranch 
            },
            createdByRole: userRole,
          });
        }
   
        const orderData = res.data.data;
        onOrderPlaced?.(orderData.id, orderData);
        setLastOrder(orderData);
        // setShowPrintView(true);
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

  const handlePayNow = async (paymentMethod: PaymentMethod) => {
    if (!lastOrder) return;
    
    try {
      setIsPlacingOrder(true);
      const res = await orderApi.updatePaymentStatus(lastOrder.id, {
        paymentStatus: 'PAID',
        paymentMethod,
      });
      
      if (res?.data?.data) {
        toast.success('Payment processed successfully!');
        const updatedOrder = {
          ...res.data.data,
          // Add a flag to indicate this is a payment receipt
          isPaymentReceipt: true,
          paymentMethod: paymentMethod,
          paymentStatus: 'PAID' as const
        };
        
        setLastOrder(updatedOrder);
        
        // Print the receipt with payment confirmation
        handleDirectPrint(
          updatedOrder,
          false, // isPartialPrint
          []    // newItems (empty for full receipt)
        );
        
        // Reset cart and form
        onClearCart();
        onCustomerNameChange('');
        if (orderType === 'DINE_IN') {
          onTableNumberChange('');
        }
        
        // Notify parent component
        onOrderPlaced?.(updatedOrder.id, updatedOrder);
      } else {
        toast.error('Failed to process payment');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error?.response?.data?.message || 'Failed to process payment');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePrintReceipt = (order: any) => {
    if (!order) return;
    
    // For updated orders, show only the updated items
    if (order._printData?.isUpdate) {
      const updatedItems = order._printData.updatedItems || [];
      if (updatedItems.length > 0) {
        handleDirectPrint(order, true, updatedItems);
      } else {
        toast.info('No updated items to print');
      }
    } else {
      // For new orders, show all items
      handleDirectPrint(order, false, []);
    }
  };

  // Enhanced print function with tablet support
  const handleDirectPrint = useCallback((order: any, isPartialPrint: boolean, newItems: any[]) => {
    if (!order) return;

    setIsPrinting(true);
    
    const printContent = generateReceiptHTML(order, isPartialPrint, newItems);
    
    // Check if we're on a tablet device
    const isTablet = /iPad|Android|Tablet/i.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isTablet) {
      // Tablet-friendly printing with larger dimensions and better margins
      const printWindow = window.open('', '_blank', 'width=400,height=700,left=100,top=50');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${order.orderNumber}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @media print {
                  @page {
                    size: 80mm auto;
                    margin: 5mm 3mm 5mm 5mm; /* Increased left margin for tablets */
                    padding: 0;
                  }
                  body {
                    margin: 0;
                    padding: 15px 10px 15px 15px; /* Increased left padding */
                    font-family: 'Courier New', monospace;
                    font-size: 14px; /* Slightly larger font for tablets */
                    width: 80mm;
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .receipt {
                    width: 100%;
                    max-width: 80mm;
                    margin: 0 auto;
                    padding-left: 5px; /* Additional left padding for receipt content */
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 15px;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 15px;
                  }
                  .company-name {
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 8px;
                  }
                  .order-info {
                    margin-bottom: 20px;
                  }
                  .order-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                  }
                  .items {
                    margin-bottom: 20px;
                  }
                  .item-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                  }
                  .item-name {
                    flex: 1;
                    margin-right: 10px;
                  }
                  .totals {
                    border-top: 1px dashed #000;
                    padding-top: 15px;
                    margin-top: 15px;
                  }
                  .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                  }
                  .grand-total {
                    font-weight: bold;
                    border-top: 2px solid #000;
                    padding-top: 8px;
                    margin-top: 8px;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 25px;
                    font-size: 12px;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
                body {
                  margin: 0;
                  padding: 15px 10px 15px 15px; /* Increased left padding for tablet preview */
                  font-family: 'Courier New', monospace;
                  font-size: 14px;
                  width: 80mm;
                  background: white;
                  line-height: 1.4;
                }
                .receipt {
                  width: 100%;
                  max-width: 80mm;
                  margin: 0 auto;
                  padding-left: 5px;
                }
                .print-message {
                  background: #f0f0f0;
                  padding: 10px;
                  margin: 10px 0;
                  border-radius: 5px;
                  font-size: 12px;
                  text-align: center;
                  border-left: 4px solid #007bff;
                }
              </style>
            </head>
            <body>
              <div class="print-message">
                Tablet Print Mode - Ensure your thermal printer is connected and set as default printer
              </div>
              <div class="receipt">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(() => {
                    window.print();
                    setTimeout(() => {
                      window.close();
                    }, 1500);
                  }, 500);
                };
                
                // Fallback for print cancellation
                window.onbeforeunload = function() {
                  if (!document.hidden) {
                    setTimeout(() => {
                      window.close();
                    }, 2000);
                  }
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        // Fallback for popup blockers - use iframe approach for tablets
        handleTabletPrintFallback(printContent, order.orderNumber);
      }
    } else {
      // Desktop printing (original logic)
      const printWindow = window.open('', '_blank', 'width=350,height=600');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${order.orderNumber}</title>
              <style>
                @media print {
                  @page {
                    size: 80mm auto;
                    margin: 0;
                    padding: 0;
                  }
                  body {
                    margin: 0;
                    padding: 10px 5px 10px 10px; /* Added left padding */
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    width: 80mm;
                    background: white;
                    -webkit-print-color-adjust: exact;
                  }
                  .receipt {
                    width: 100%;
                    max-width: 80mm;
                    margin: 0 auto;
                    padding-left: 3px; /* Additional left padding */
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 10px;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 10px;
                  }
                  .company-name {
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 5px;
                  }
                  .order-info {
                    margin-bottom: 15px;
                  }
                  .order-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 3px;
                  }
                  .items {
                    margin-bottom: 15px;
                  }
                  .item-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                  }
                  .item-name {
                    flex: 1;
                  }
                  .totals {
                    border-top: 1px dashed #000;
                    padding-top: 10px;
                    margin-top: 10px;
                  }
                  .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 3px;
                  }
                  .grand-total {
                    font-weight: bold;
                    border-top: 2px solid #000;
                    padding-top: 5px;
                    margin-top: 5px;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 10px;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
                body {
                  margin: 0;
                  padding: 10px 5px 10px 10px; /* Added left padding for preview */
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  width: 80mm;
                  background: white;
                }
              </style>
            </head>
            <body>
              <div class="receipt">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(() => {
                    window.print();
                    setTimeout(() => {
                      window.close();
                    }, 1000);
                  }, 300);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        // Fallback if popup is blocked
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = `
          <div class="receipt" style="width: 80mm; margin: 0 auto; font-family: 'Courier New', monospace; font-size: 12px; padding: 10px 5px 10px 15px;">
            ${printContent}
          </div>
        `;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
      }
    }
    
    setIsPrinting(false);
    setShowPrintView(false);
  }, []);

  // Tablet print fallback using iframe
  const handleTabletPrintFallback = (printContent: string, orderNumber: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (iframeDoc) {
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${orderNumber}</title>
            <style>
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 5mm 3mm 5mm 5mm;
                  padding: 0;
                }
                body {
                  margin: 0;
                  padding: 15px 10px 15px 15px;
                  font-family: 'Courier New', monospace;
                  font-size: 14px;
                  width: 80mm;
                  background: white;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .receipt {
                  width: 100%;
                  max-width: 80mm;
                  margin: 0 auto;
                  padding-left: 5px;
                }
              }
              body {
                margin: 0;
                padding: 15px 10px 15px 15px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                width: 80mm;
                background: white;
                line-height: 1.4;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 500);
    }
  };

  // Helper function to find new items in an updated order
  const getNewItems = (updatedItems: any[] = [], originalItems: any[] = []) => {
    if (!updatedItems || !originalItems) return [];
    
    // Create a map of original item IDs to their quantities
    const originalItemsMap = new Map();
    originalItems.forEach((item: any) => {
      originalItemsMap.set(item.menuItemId, (originalItemsMap.get(item.menuItemId) || 0) + item.quantity);
    });
    
    // Find items that are new or have increased in quantity
    const newItems = [];
    const updatedItemsMap = new Map();
    
    updatedItems.forEach((item: any) => {
      updatedItemsMap.set(item.menuItemId, (updatedItemsMap.get(item.menuItemId) || 0) + item.quantity);
    });
    
    // Compare quantities to find new or increased items
    for (const [menuItemId, updatedQty] of updatedItemsMap.entries()) {
      const originalQty = originalItemsMap.get(menuItemId) || 0;
      if (updatedQty > originalQty) {
        const item = updatedItems.find((i: any) => i.menuItemId === menuItemId);
        if (item) {
          newItems.push({
            ...item,
            quantity: updatedQty - originalQty
          });
        }
      }
    }
    
    return newItems;
  };

  // Track original items when in edit mode
  const [originalItems, setOriginalItems] = useState<any[]>([]);

  // Set original items when entering edit mode
  useEffect(() => {
    if (isEditMode && editOrderData?.data?.items) {
      setOriginalItems([...editOrderData.data.items]);
    }
  }, [isEditMode, editOrderData]);

  // Generate receipt HTML with improved left margin
  const generateReceiptHTML = (order: any, isPartialPrint: boolean = false, newItems: any[] = []) => {
    if (!order) return '';
    
    // For updated orders, use the _printData to get only the changed items
    const isUpdatePrint = order._printData?.isUpdate === true;
    
    // Get items to print - for updates, only show the changed items
    let itemsToPrint = [];
    if (isUpdatePrint) {
      // Get the updated items from _printData
      itemsToPrint = order._printData?.updatedItems || [];
    } else if (isPartialPrint && newItems.length > 0) {
      itemsToPrint = newItems;
    } else {
      itemsToPrint = order.items || [];
    }

    // Calculate subtotal for the items being printed
    let printSubtotal = 0;
    let printTax = 0;
    let printTotal = 0;

    if (isUpdatePrint) {
      // For update prints, only calculate based on the updated/added items
      printSubtotal = itemsToPrint.reduce((sum: number, item: any) => {
        return sum + (item.total || 0);
      }, 0);
      
      // Calculate tax only on the new items
      printTax = order.taxRate ? (printSubtotal * (order.taxRate || 0) / 100) : 0;
      printTotal = printSubtotal + printTax;
    } else if (isPartialPrint && newItems.length > 0) {
      // For partial prints, only show the new items
      printSubtotal = newItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      printTax = order.taxRate ? (printSubtotal * (order.taxRate || 0) / 100) : 0;
      printTotal = printSubtotal + printTax;
    } else {
      // For new orders or full receipts, use the full order totals
      printSubtotal = order.subtotal || 0;
      printTax = order.tax || 0;
      printTotal = order.total || 0;
    }

    return `
      <div class="header">
        <div class="company-name">RESTAURANT POS</div>
        <div>${order.branchName || 'Main Branch'}</div>
        <div>${new Date().toLocaleString()}</div>
      </div>

      <div class="order-info">
        <div class="order-row">
          <span>Order #:</span>
          <span>${order.orderNumber || ''}</span>
        </div>
        <div class="order-row">
          <span>Date:</span>
          <span>${new Date(order.createdAt || new Date()).toLocaleString()}</span>
        </div>
        ${order.tableNumber ? `
          <div class="order-row">
            <span>Table:</span>
            <span>${order.tableNumber}</span>
          </div>
        ` : ''}
        ${order.customerName ? `
          <div class="order-row">
            <span>Customer:</span>
            <span>${order.customerName}</span>
          </div>
        ` : ''}
        ${isUpdatePrint ? `
          <div class="order-row" style="color: #d97706; font-weight: bold; margin-top: 10px;">
            <span>*** ORDER UPDATED ***</span>
          </div>
        ` : ''}
      </div>

      <div class="items">
        <div class="order-row" style="font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 8px;">
          <span>${isUpdatePrint ? 'Updated Items' : 'Item'}</span>
          <span>Total</span>
        </div>
        ${itemsToPrint.length > 0 ? itemsToPrint.map((item: any) => `
          <div class="item-row" style="${isUpdatePrint ? 'color: #d97706;' : ''}">
            <div class="item-name">
              ${item.quantity}x ${item.name}
              ${item.modifiers?.length > 0 ? `
                <div style="margin-left: 10px; font-size: 0.9em; margin-top: 2px;">
                  ${item.modifiers.map((m: any) => `+ ${m.name}`).join('<br/>')}
                </div>
              ` : ''}
            </div>
            <div style="text-align: right; min-width: 60px;">£${Number(item.total || 0).toFixed(2)}</div>
          </div>
        `).join('') : '<div style="text-align: center; padding: 10px 0; color: #666;">No items to display</div>'}
      </div>

      <div class="totals">
        ${isUpdatePrint ? `
          <div class="total-row">
            <span>New Items Subtotal:</span>
            <span>£${printSubtotal.toFixed(2)}</span>
          </div>
          ${printTax > 0 ? `
            <div class="total-row">
              <span>Tax (${order.taxRate || 0}%):</span>
              <span>£${printTax.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="grand-total">
            <span>Total for New Items:</span>
            <span>£${printTotal.toFixed(2)}</span>
          </div>
        ` : `
          <div class="total-row">
            <span>Subtotal:</span>
            <span>£${printSubtotal.toFixed(2)}</span>
          </div>
          ${printTax > 0 ? `
            <div class="total-row">
              <span>Tax (${order.taxRate || 0}%):</span>
              <span>£${printTax.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="grand-total">
            <span>Total:</span>
            <span>£${printTotal.toFixed(2)}</span>
          </div>
          ${order.discount ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-£${order.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          ${order.tax ? `
            <div class="total-row">
              <span>Tax (${order.taxRate || 0}%):</span>
              <span>£${order.tax.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>£${order.total?.toFixed(2) || '0.00'}</span>
          </div>
        `}
      </div>

      <div class="footer">
        <div>${isUpdatePrint ? 'Thank you for your update!' : 'Thank you for your order!'}</div>
        <div>Please visit again</div>
        <div style="margin-top: 10px; font-size: 0.8em; color: #666;">
          Printed: ${new Date().toLocaleString()}
        </div>
      </div>
    `;
  };

  // Cart item render function
  const renderCartItem = (cartItem: CartItem) => {
    const { item, quantity, totalPrice, selectedModifiers } = cartItem;
    
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
  };

  // Handle order placement completion
  useEffect(() => {
    if (lastOrder) {
      if (!isEditMode) {
        // Auto-print the receipt for new orders, but not for cafes
        if (!isCafe) {
          const timer = setTimeout(() => {
            handleDirectPrint(lastOrder, false, []);
          }, 500);
          
          return () => clearTimeout(timer);
        }
      } else if (lastOrder._printData?.isUpdate) {
        // For updated orders, show the print dialog with only the updated items, but not for cafes
        if (!isCafe) {
          setShowPrintView(true);
        }
      }
    }
  }, [lastOrder, isEditMode, handleDirectPrint, isCafe]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Print Modal */}
      {showPrintView && lastOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {lastOrder._printData?.isUpdate ? 'Print Updated Items' : 'Print Receipt'} - Order #{lastOrder.orderNumber}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // For updates, show only new items, for new orders show all items
                    const newItems = lastOrder._printData?.isUpdate ? getNewItems(lastOrder.items, lastOrder.originalItems) : [];
                    handleDirectPrint(lastOrder, lastOrder._printData?.isUpdate, newItems);
                  }}
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  {isPrinting ? 'Printing...' : 'Print'}
                </Button>
                <button
                  onClick={() => setShowPrintView(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {/* Preview of receipt */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">RESTAURANT POS</h3>
                  <p className="text-sm">{lastOrder.branchName || 'Main Branch'}</p>
                  <p className="text-sm">{new Date().toLocaleString()}</p>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Order #:</span>
                    <span>{lastOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(lastOrder.createdAt || new Date()).toLocaleString()}</span>
                  </div>
                  {lastOrder.tableNumber && (
                    <div className="flex justify-between">
                      <span>Table:</span>
                      <span>{lastOrder.tableNumber}</span>
                    </div>
                  )}
                  {lastOrder.customerName && (
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span>{lastOrder.customerName}</span>
                    </div>
                  )}
                  {lastOrder._printData?.isUpdate && (
                    <div className="text-amber-700 font-medium text-center py-1">
                      *** ORDER UPDATED - NEW ITEMS ONLY ***
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t pt-2">
                  <div className="font-semibold text-center mb-2">
                    {lastOrder._printData?.isUpdate ? 'NEW ITEMS' : 'ORDER ITEMS'}
                  </div>
                  {(lastOrder._printData?.isUpdate ? 
                    
                    (lastOrder._printData?.updatedItems, lastOrder._printData?.originalItems) : 
                    lastOrder.items || []
                  ).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm mb-1">
                      <span>{item.quantity}x {item.name}</span>
                      <span>£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>TOTAL:</span>
                    <span>£{lastOrder.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPrintView(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => handleDirectPrint(lastOrder, lastOrder._printData?.isUpdate || false, [])}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="p-3 space-y-3 md:flex-1 md:overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-3 opacity-30" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          cart.map(renderCartItem)
        )}
      </div>

      {/* Form + Totals */}
      <div className="p-4 border-t space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Restaurant */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Restaurant</label>
            {isEditMode || isManager ? (
              <Input
                value={restaurants.find((r) => r.id === selectedRestaurant)?.name || ''}
                disabled
                className="bg-gray-100"
              />
            ) : (
              <Select value={selectedRestaurant} onValueChange={onRestaurantChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((restaurant) => (
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
            <label className="block text-sm font-medium text-gray-700">Branch</label>
            {isEditMode || isManager ? (
              <Input 
                value={filteredBranches.find(b => b.id === selectedBranch)?.name || ''} 
                disabled 
                className="bg-gray-100" 
              />
            ) : filteredBranches.length === 0 ? (
              <div className="w-full p-2 border rounded-md bg-gray-50 text-gray-500 text-sm">
                No branch assigned
              </div>
            ) : (
              <Select value={selectedBranch || ''} onValueChange={onBranchChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBranches.map((branch) => (
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
                      const isOccupied = (occupiedTables as Set<string>).has(num) && num !== tableNumber;
                      return (
                        <SelectItem
                          key={num}
                          value={num}
                          disabled={isOccupied}
                          className={isOccupied ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {isOccupied
                            ? `Table ${num} (Occupied - ${occupiedTables.has(num) ? 'Payment Pending' : 'Available'})`
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
                {allowedOrderTypes.map((type) => (
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
            {isCafe ? (
              <>
                <Button
                  className="w-full mt-3"
                  size="lg"
                  onClick={() => setShowPaymentModal(true)}
                  disabled={
                    isPlacingOrder || 
                    cart.length === 0 ||
                    !selectedRestaurant ||
                    !selectedBranch ||
                    (orderType === 'DINE_IN' && !tableNumber && !isManager) ||
                    (orderType === 'TAKEAWAY' && !customerName.trim() && !isManager)
                  }
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing...
                    </>
                  ) : (
                    `Pay Now ( £${cartTotal.toFixed(2)})`
                  )}
                </Button>

                {showPaymentModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Payment</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPaymentModal(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <PaymentCalculator
                        totalAmount={cartTotal}
                        onPaymentComplete={handlePaymentComplete}
                        onCancel={() => setShowPaymentModal(false)}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Button
                className="w-full mt-3"
                size="lg"
                onClick={() => handlePlaceOrder()}
                disabled={
                  isPlacingOrder || 
                  cart.length === 0 ||
                  !selectedRestaurant ||
                  !selectedBranch ||
                  (orderType === 'DINE_IN' && !tableNumber && !isManager) ||
                  (orderType === 'TAKEAWAY' && !customerName.trim() && !isManager)
                }
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing...
                  </>
                ) : (
                  `Place Order ( £${cartTotal.toFixed(2)})`
                )}
              </Button>
            )}
          </PermissionGate>

          {cart.length > 0 && (
            <Button
              variant="outline"
              onClick={onClearCart}
              className="w-full"
            >
              Clear Cart
            </Button>
          )}

          {lastOrder && (
            <Button
              onClick={() => {
                setShowPrintView(true);
              }}
              variant="outline"
              className="w-full"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
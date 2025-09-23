// 'use client';

// import { useState } from 'react';
// import { MenuItem } from '@/types/menu';
// import { Button } from '@/components/ui/button';
// import { Plus, Minus, Trash2, Utensils, Loader2, ShoppingCart } from 'lucide-react';
// import { Input } from '@/components/ui/input';
// import { toast } from 'sonner';
// import PermissionGate from '@/components/auth/permission-gate';
// import orderApi, { PaymentMethod, OrderStatus } from '@/lib/order-api';

// interface CartItem {
//   item: MenuItem;
//   quantity: number;
// }

// interface OrderSummaryProps {
//   cart: CartItem[];
//   onUpdateCart: (items: CartItem[]) => void;
//   onClearCart: () => void;
//   subtotal: number;
//   tax: number;
//   total: number;
//   onBranchChange: (branchId: string) => void;
//   onTableNumberChange: (tableNumber: string) => void;
//   onCustomerNameChange: (name: string) => void;
//   selectedBranch: string;
//   tableNumber: string;
//   customerName: string;
//   onOrderPlaced?: () => void;
// }

// const branches = [
//   { id: '1', name: 'Main Branch' },
//   { id: '2', name: 'Downtown' },
//   { id: '3', name: 'Uptown' },
// ];

// const tableNumbers = Array.from({ length: 20 }, (_, i) => (i + 1).toString());

// export function OrderSummary({
//   cart,
//   onUpdateCart,
//   onClearCart,
//   subtotal,
//   tax,
//   total,
//   onBranchChange,
//   onTableNumberChange,
//   onCustomerNameChange,
//   selectedBranch,
//   tableNumber,
//   customerName,
//   onOrderPlaced,
// }: OrderSummaryProps) {
//   const [isPlacingOrder, setIsPlacingOrder] = useState(false);

//   const updateQuantity = (itemId: string, newQuantity: number) => {
//     if (newQuantity < 1) {
//       onUpdateCart(cart.filter(item => item.item.id !== itemId));
//     } else {
//       onUpdateCart(
//         cart.map(item =>
//           item.item.id === itemId ? { ...item, quantity: newQuantity } : item
//         )
//       );
//     }
//   };

//   const removeItem = (itemId: string) => {
//     onUpdateCart(cart.filter(item => item.item.id !== itemId));
//   };

//   const handlePlaceOrder = async () => {
//     if (cart.length === 0) {
//       toast.error('Your cart is empty');
//       return;
//     }
//     try {
//       setIsPlacingOrder(true);
//       // Build order payload
//       const items = cart.map(({ item, quantity }) => ({
//         menuItemId: item.id,
//         quantity,
//         name: item.name,
//         price: item.price,
//       }));

//       const payload = {
//         tableNumber: tableNumber || undefined,
//         customerName: customerName || undefined,
//         items,
//         paymentMethod: PaymentMethod.CASH as PaymentMethod, // default, adjust via UI later
//         branchName: selectedBranch || undefined,
//         subtotal,
//         tax,
//         total,
//         status: OrderStatus.PENDING as OrderStatus,
//         notes: "", // send empty string to satisfy backend string validation
//       } as const;

//       const res = await orderApi.createOrder(payload as any);
//       if ((res as any)?.data?.data) {
//         toast.success('Order placed!');
//         onClearCart();
//         onOrderPlaced?.();
//       } else {
//         toast.error('Failed to place order');
//       }
//     } catch (e: any) {
//       console.error('Place order error:', e);
//       toast.error(e?.response?.data?.message || 'Failed to place order');
//     } finally {
//       setIsPlacingOrder(false);
//     }
//   };

//   return (
//     <div className="flex flex-col h-full">
//       {/* Cart Items */}
//       <div className="flex-1 overflow-y-auto p-2">
//         {cart.length === 0 ? (
//           <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
//             <ShoppingCart className="h-16 w-16 mb-3 opacity-30" />
//             <p>Your cart is empty</p>
//           </div>
//         ) : (
//           <div className="grid gap-2">
//             {cart.map(({ item, quantity }) => (
//               <div
//                 key={item.id}
//                 className="bg-white rounded-md border p-2 shadow-sm flex items-start justify-between"
//               >
//                 <div className="flex gap-2">
//                   {item.imageUrl ? (
//                     <img
//                       src={item.imageUrl}
//                       alt={item.name}
//                       className="w-12 h-12 rounded-md object-cover"
//                     />
//                   ) : (
//                     <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
//                       <Utensils className="h-4 w-4 text-gray-400" />
//                     </div>
//                   )}
//                   <div>
//                     <p className="font-medium text-sm leading-tight">{item.name}</p>
//                     <p className="text-xs text-gray-500 leading-tight">${item.price.toFixed(2)} × {quantity}</p>
//                   </div>
//                 </div>
//                 <div className="flex flex-col items-end gap-1">
//                   <p className="font-semibold text-sm">${(item.price * quantity).toFixed(2)}</p>
//                   <div className="flex items-center gap-1">
//                     <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, quantity - 1)}>
//                       <Minus className="h-3 w-3" />
//                     </Button>
//                     <span className="px-1 text-sm min-w-[1.5rem] text-center">{quantity}</span>
//                     <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, quantity + 1)}>
//                       <Plus className="h-3 w-3" />
//                     </Button>
//                   </div>
//                   <button className="text-red-500 text-[11px]" onClick={() => removeItem(item.id)}>
//                     <Trash2 className="h-3 w-3 inline mr-1" /> Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Form + Totals */}
//       <div className="p-3 border-t space-y-3">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
//             <select
//               value={selectedBranch}
//               onChange={(e) => onBranchChange(e.target.value)}
//               className="w-full border rounded-md p-2 text-sm"
//             >
//               <option value="">Select Branch</option>
//               {branches.map(b => (
//                 <option key={b.id} value={b.id}>{b.name}</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
//             <select
//               value={tableNumber}
//               onChange={(e) => onTableNumberChange(e.target.value)}
//               className="w-full border rounded-md p-2 text-sm"
//             >
//               <option value="">Select Table</option>
//               {tableNumbers.map(num => (
//                 <option key={num} value={num}>{num}</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
//             <Input
//               type="text"
//               placeholder="Customer Name"
//               value={customerName}
//               onChange={(e) => onCustomerNameChange(e.target.value)}
//               className="w-full text-sm"
//             />
//           </div>
//         </div>

//         <div className="flex justify-between text-sm">
//           <span>Subtotal</span>
//           <span>${subtotal.toFixed(2)}</span>
//         </div>
//         <div className="flex justify-between text-sm">
//           <span>Tax</span>
//           <span>${tax.toFixed(2)}</span>
//         </div>
//         <div className="flex justify-between font-semibold text-base">
//           <span>Total</span>
//           <span>${total.toFixed(2)}</span>
//         </div>

//         <PermissionGate required="ORDER_CREATE" disableInsteadOfHide>
//           <Button
//             className="w-full mt-2"
//             size="sm"
//             onClick={handlePlaceOrder}
//             disabled={isPlacingOrder || cart.length === 0}
//           >
//             {isPlacingOrder ? (
//               <>
//                 <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing...
//               </>
//             ) : (
//               `Place Order ($${total.toFixed(2)})`
//             )}
//           </Button>
//         </PermissionGate>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, Utensils, Loader2, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import PermissionGate from '@/components/auth/permission-gate';
import orderApi, { PaymentMethod, OrderStatus } from '@/lib/order-api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CartItem {
  item: MenuItem;
  quantity: number;
}

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
  onOrderPlaced?: () => void;
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
}: OrderSummaryProps) {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      onUpdateCart(cart.filter(item => item.item.id !== itemId));
    } else {
      onUpdateCart(
        cart.map(item =>
          item.item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeItem = (itemId: string) => {
    onUpdateCart(cart.filter(item => item.item.id !== itemId));
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
      if ((res as any)?.data?.data) {
        toast.success('Order placed!');
        onClearCart();
        onOrderPlaced?.();
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
      <div className="p-4 border-t space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Branch</label>
              <Select
                value={selectedBranch || ''}
                onValueChange={onBranchChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
      </div>
    </div>
  );
}
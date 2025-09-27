import React from 'react';
import { format } from 'date-fns';
// Define local types to avoid Prisma dependency
type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_PAYMENT' | 'OTHER';
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  tax: number;
  notes?: string | null;
}
import { formatCurrency } from '@/lib/utils';

interface ReceiptTemplateProps {
  order: {
    id: string;
    orderNumber: string;
    createdAt: Date;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    customerName?: string | null;
    tableNumber?: string | null;
    branchName: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      total: number;
      tax: number;
      notes?: string | null;
    }>;
  };
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    website?: string;
    taxId?: string;
  };
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ order, companyInfo }, ref) => {
    const currentDate = new Date();
    
    // Default company info
    const defaultCompanyInfo = {
      name: 'Restaurant Name',
      address: '123 Main St, City, Country',
      phone: '+1 234 567 8900',
      email: 'info@restaurant.com',
      website: 'www.restaurant.com',
      taxId: 'TAX-123456',
      ...companyInfo,
    };

    return (
      <div 
        ref={ref} 
        className="w-full max-w-xs mx-auto p-4 bg-white text-xs print:p-0 print:max-w-none print:w-full"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">{defaultCompanyInfo.name}</h2>
          <p className="text-xs">{defaultCompanyInfo.address}</p>
          <p className="text-xs">Tel: {defaultCompanyInfo.phone}</p>
          {defaultCompanyInfo.taxId && (
            <p className="text-xs">Tax ID: {defaultCompanyInfo.taxId}</p>
          )}
        </div>

        <div className="border-t border-b border-dashed border-gray-400 py-2 my-2">
          <div className="flex justify-between">
            <span>Order #:</span>
            <span>{order.orderNumber || order.id.split('-')[0].toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</span>
          </div>
          {order.tableNumber && (
            <div className="flex justify-between">
              <span>Table:</span>
              <span>{order.tableNumber}</span>
            </div>
          )}
          {order.customerName && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-medium">{order.status}</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="my-2">
          {order.items.map((item) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between">
                <span className="font-medium">
                  {item.quantity}x {item.name}
                </span>
                <span>{formatCurrency(item.total)}</span>
              </div>
              {item.notes && (
                <div className="text-xs italic text-gray-600 pl-4">
                  Note: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-b border-dashed border-gray-400 py-2 my-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({Math.round((order.tax / order.subtotal) * 100)}%):</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>TOTAL:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Payment:</span>
            <span className="uppercase">{order.paymentMethod}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-xs">
          <p>Thank you for dining with us!</p>
          <p>Generated on: {format(currentDate, 'MMM dd, yyyy HH:mm')}</p>
          {defaultCompanyInfo.website && (
            <p>Visit us at: {defaultCompanyInfo.website}</p>
          )}
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';

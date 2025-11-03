'use client';

import { useEffect, useRef } from 'react';

interface OrderPrintViewProps {
  order: any;
  onAfterPrint?: () => void;
}

export function OrderPrintView({ order, onAfterPrint }: OrderPrintViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!order || !printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      // Fallback if popup is blocked
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
      onAfterPrint?.();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Order ${order.orderNumber || ''}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 10px;
              font-size: 12px;
              line-height: 1.4;
            }
            .receipt {
              width: 100%;
              max-width: 300px;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .mt-2 { margin-top: 0.5rem; }
            .border-t { border-top: 1px dashed #000; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .w-full { width: 100%; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 1000);">
          <div class="receipt">
            ${printContent}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    const handlePrint = () => {
      onAfterPrint?.();
    };

    printWindow.addEventListener('afterprint', handlePrint);

    return () => {
      printWindow.removeEventListener('afterprint', handlePrint);
    };
  }, [order, onAfterPrint]);

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return `£${amount?.toFixed(2) || '0.00'}`;
  };

  return (
    <div ref={printRef} className="print:block">
      <div className="text-center">
        <h1 className="font-bold text-lg">RESTAURANT NAME</h1>
        <p>123 Main Street, City</p>
        <p>Tel: (123) 456-7890</p>
      </div>

      <div className="mt-2">
        <div className="flex justify-between">
          <span>Order #:</span>
          <span>{order.orderNumber || `ORD-${order.id?.slice(0, 8)?.toUpperCase() || 'N/A'}`}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(order.createdAt || new Date()).toLocaleString()}</span>
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
      </div>

      <div className="mt-4">
        <div className="border-t py-2">
          <div className="flex justify-between font-bold">
            <span>ITEM</span>
            <span>TOTAL</span>
          </div>
        </div>
        {order.items?.map((item: any, index: number) => (
          <div key={index} className="border-t py-2">
            <div className="flex justify-between">
              <span className="font-bold">
                {item.quantity}x {item.name}
              </span>
              <span>{formatCurrency(item.total || item.price * item.quantity)}</span>
            </div>
            {item.modifiers?.map((mod: any, modIndex: number) => (
              <div key={modIndex} className="pl-4 text-sm">
                + {mod.name} ({formatCurrency(mod.price)})
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal || 0)}</span>
        </div>
        {order.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax ({order.taxRate || 0}%):</span>
            <span>{formatCurrency(order.tax || 0)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(order.discount || 0)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>TOTAL:</span>
          <span>{formatCurrency(order.total || 0)}</span>
        </div>
      </div>

      <div className="mt-4 text-center text-sm">
        <p>Thank you for your order!</p>
        <p>Please come again</p>
      </div>
    </div>
  );
}

export default OrderPrintView;
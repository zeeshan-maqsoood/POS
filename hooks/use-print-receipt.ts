import { useRef, useState } from 'react';

export function usePrintReceipt() {
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const printReceipt = () => {
    if (!receiptRef.current) return;
    
    setIsPrinting(true);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setIsPrinting(false);
      return;
    }
    
    // Get the receipt HTML
    const receiptHtml = receiptRef.current.innerHTML;
    
    // Create a print-friendly HTML document
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @page { 
              size: auto;  
              margin: 0mm;
            }
            @media print {
              body { 
                -webkit-print-color-adjust: exact;
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = function() { window.close(); }">
          ${receiptHtml}
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <p>If the receipt doesn't print automatically, please use the print dialog in your browser.</p>
            <button onclick="window.print()">Print Receipt</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `;
    
    // Write the document and close the window after printing
    printWindow.document.open();
    printWindow.document.write(printDocument);
    printWindow.document.close();
    
    // Handle cases where printing might be blocked
    const timer = setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
      setIsPrinting(false);
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timer);
  };

  return {
    receiptRef,
    isPrinting,
    printReceipt,
  };
}

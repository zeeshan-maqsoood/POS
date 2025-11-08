// QZ Tray Service for handling printer connections and printing
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    qz: any;
  }
}

class QZTrayService {
  private static instance: QZTrayService;
  private isConnected: boolean = false;
  private isInitialized: boolean = false;
  private defaultPrinter: string = '';

  private constructor() {}

  public static getInstance(): QZTrayService {
    if (!QZTrayService.instance) {
      QZTrayService.instance = new QZTrayService();
    }
    return QZTrayService.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      // Load QZ Tray script if not already loaded
      if (!window.qz) {
        await this.loadQZTrayScript();
      }
      
      // Set up QZ Tray
      window.qz.security.setCertificatePromise((resolve: any) => {
        // For development, we'll use the default certificate
        // In production, you should implement proper certificate handling
        resolve();
      });

      // Set up error handling
      window.qz.security.setSignatureAlgorithm('SHA512');
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize QZ Tray:', error);
      return false;
    }
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected) return true;
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      await window.qz.websocket.connect();
      this.isConnected = true;
      
      // Get default printer
      const printers = await this.getPrinters();
      if (printers.length > 0) {
        this.defaultPrinter = printers[0];
      }
      
      return true;
    } catch (error) {
      console.error('Failed to connect to QZ Tray:', error);
      this.isConnected = false;
      return false;
    }
  }

  public async getPrinters(): Promise<string[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await window.qz.printers.find();
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
  }

  public async print(printerName: string, content: any, format: 'raw' | 'html' | 'pdf' = 'raw') {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const config = window.qz.configs.create(printerName);
      let printData;

      if (format === 'html') {
        printData = [{
          type: 'html',
          format: 'file',
          data: content,
          options: {
            // Add any HTML print options here
          }
        }];
      } else if (format === 'pdf') {
        printData = [{
          type: 'pdf',
          format: 'file',
          data: content
        }];
      } else {
        // Raw text printing (default)
        printData = [{
          type: 'raw',
          format: 'plain',
          data: content
        }];
      }

      return await window.qz.print(config, printData);
    } catch (error) {
      console.error('Printing error:', error);
      throw error;
    }
  }

  public async printReceipt(printerName: string, orderData: any) {
    // Format the receipt content
    const receiptContent = this.formatReceipt(orderData);
    return await this.print(printerName, receiptContent);
  }

  private formatReceipt(orderData: any): string {
    // Customize this method to format your receipt
    let receipt = '\x1B@\x1BE'; // Initialize printer and set bold on
    receipt += '=== RECEIPT ===\n\n';
    receipt += `Order #${orderData.orderNumber}\n`;
    receipt += `Date: ${new Date().toLocaleString()}\n\n`;
    receipt += '----------------\n';
    
    // Add items
    orderData.items.forEach((item: any) => {
      receipt += `${item.quantity}x ${item.name.padEnd(20).substring(0, 20)}`;
      receipt += `${(item.price * item.quantity).toFixed(2).padStart(8)}\n`;
    });
    
    receipt += '----------------\n';
    receipt += `Subtotal: $${orderData.subtotal.toFixed(2)}\n`;
    receipt += `Tax: $${orderData.tax.toFixed(2)}\n`;
    receipt += `Total: $${orderData.total.toFixed(2)}\n\n`;
    receipt += 'Thank you for your order!\n';
    receipt += '\x1Bd\x03'; // Cut paper (3 lines feed before cut)
    
    return receipt;
  }

  private loadQZTrayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qz-tray@3.0.0/dist/qz-tray.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (error) => reject(new Error('Failed to load QZ Tray script'));
      document.head.appendChild(script);
    });
  }

  public disconnect() {
    if (this.isConnected) {
      window.qz.websocket.disconnect();
      this.isConnected = false;
    }
  }
}

export const qzTrayService = QZTrayService.getInstance();

// React Hook for QZ Tray
export const useQZTray = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeQZTray = async () => {
      try {
        await qzTrayService.initialize();
        const connected = await qzTrayService.connect();
        
        if (connected) {
          const availablePrinters = await qzTrayService.getPrinters();
          setPrinters(availablePrinters);
          setIsConnected(true);
          setError(null);
        } else {
          setError('Failed to connect to QZ Tray. Please make sure QZ Tray is running.');
        }
      } catch (err) {
        console.error('QZ Tray initialization error:', err);
        setError('Failed to initialize QZ Tray. Please check the console for more details.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeQZTray();

    // Cleanup on unmount
    return () => {
      if (qzTrayService) {
        qzTrayService.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    printers,
    error,
    isLoading,
    print: qzTrayService.print.bind(qzTrayService),
    printReceipt: qzTrayService.printReceipt.bind(qzTrayService),
    getPrinters: qzTrayService.getPrinters.bind(qzTrayService)
  };
};

export default qzTrayService;

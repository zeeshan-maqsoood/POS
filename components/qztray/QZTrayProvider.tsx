'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { qzTrayService, useQZTray as useQZTrayHook } from '@/lib/services/qzTrayService';

interface QZTrayContextType {
  isConnected: boolean;
  printers: string[];
  error: string | null;
  isLoading: boolean;
  print: (printerName: string, content: any, format?: 'raw' | 'html' | 'pdf') => Promise<any>;
  printReceipt: (printerName: string, orderData: any) => Promise<any>;
  getPrinters: () => Promise<string[]>;
  refreshConnection: () => Promise<void>;
}

const QZTrayContext = createContext<QZTrayContextType | undefined>(undefined);

export const QZTrayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printers, setPrinters] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Re-initialize the connection
      await qzTrayService.initialize();
      const connected = await qzTrayService.connect();
      
      if (connected) {
        const availablePrinters = await qzTrayService.getPrinters();
        setPrinters(availablePrinters);
        setIsConnected(true);
      } else {
        setError('Failed to connect to QZ Tray');
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Error refreshing QZ Tray connection:', err);
      setError('Failed to refresh QZ Tray connection');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (isInitialized) return;
      
      try {
        await refreshConnection();
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing QZ Tray:', err);
        setError('Failed to initialize QZ Tray');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (qzTrayService) {
        qzTrayService.disconnect();
      }
    };
  }, [isInitialized]);

  const print = async (printerName: string, content: any, format: 'raw' | 'html' | 'pdf' = 'raw') => {
    try {
      return await qzTrayService.print(printerName, content, format);
    } catch (err) {
      console.error('Print error:', err);
      throw err;
    }
  };

  const printReceipt = async (printerName: string, orderData: any) => {
    try {
      return await qzTrayService.printReceipt(printerName, orderData);
    } catch (err) {
      console.error('Print receipt error:', err);
      throw err;
    }
  };

  const getPrinters = async () => {
    try {
      const availablePrinters = await qzTrayService.getPrinters();
      setPrinters(availablePrinters);
      return availablePrinters;
    } catch (err) {
      console.error('Error getting printers:', err);
      throw err;
    }
  };

  return (
    <QZTrayContext.Provider
      value={{
        isConnected,
        printers,
        error,
        isLoading,
        print,
        printReceipt,
        getPrinters,
        refreshConnection,
      }}
    >
      {children}
    </QZTrayContext.Provider>
  );
};

export const useQZTray = (): QZTrayContextType => {
  const context = useContext(QZTrayContext);
  if (context === undefined) {
    throw new Error('useQZTray must be used within a QZTrayProvider');
  }
  return context;
};

export default QZTrayProvider;

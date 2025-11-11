'use client';

import { useEffect, useState } from 'react';

export function QZTrayStatus() {
  const [status, setStatus] = useState({
    isConnected: false,
    isInitialized: false,
    error: null as string | null,
  });

  useEffect(() => {
    const checkQZTray = async () => {
      try {
        // @ts-ignore - qz is loaded by QZ Tray
        if (typeof window.qz === 'undefined') {
          throw new Error('QZ Tray is not installed or not running');
        }

        // @ts-ignore
        await qz.websocket.connect();
        setStatus({
          isConnected: true,
          isInitialized: true,
          error: null,
        });
      } catch (error) {
        setStatus({
          isConnected: false,
          isInitialized: true,
          error: error instanceof Error ? error.message : 'Failed to connect to QZ Tray',
        });
      }
    };

    checkQZTray();

    return () => {
      // @ts-ignore
      if (typeof window.qz !== 'undefined') {
        // @ts-ignore
        qz.websocket.disconnect();
      }
    };
  }, []);

  if (!status.isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Checking QZ Tray status...</span>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">QZ Tray Error: </strong>
        <span className="block sm:inline">{status.error}</span>
        <div className="mt-2">
          <p>Please ensure QZ Tray is installed and running on your system.</p>
          <a 
            href="https://qz.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Download QZ Tray
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
      <strong className="font-bold">QZ Tray Status: </strong>
      <span className="block sm:inline">Connected and ready to print</span>
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
        </svg>
      </span>
    </div>
  );
}

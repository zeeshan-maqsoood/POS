'use client';

import React from 'react';
import { useQZTray } from './QZTrayProvider';
import { Button } from '../ui/button';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

export const QZTrayStatus = () => {
  const {
    isConnected,
    printers,
    error,
    isLoading,
    print,
    refreshConnection,
  } = useQZTray();

  const [selectedPrinter, setSelectedPrinter] = React.useState<string>('');
  const [isPrinting, setIsPrinting] = React.useState(false);

  React.useEffect(() => {
    // Auto-select the first available printer
    if (printers.length > 0 && !selectedPrinter) {
      setSelectedPrinter(printers[0]);
    }
  }, [printers, selectedPrinter]);

  const handlePrintTest = async () => {
    if (!selectedPrinter) {
      toast.error('Please select a printer first');
      return;
    }

    setIsPrinting(true);
    try {
      const testContent = `
=== TEST PRINT ===

This is a test print from POS Admin Panel

Date: ${new Date().toLocaleString()}
Printer: ${selectedPrinter}

\x1Bd\x03`; // 3 lines feed and cut

      await print(selectedPrinter, testContent);
      toast.success('Test print sent successfully');
    } catch (err) {
      console.error('Print error:', err);
      toast.error(`Print failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isConnected ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
          <span>QZ Tray Status</span>
        </CardTitle>
        <CardDescription>
          {isLoading
            ? 'Connecting to QZ Tray...'
            : isConnected
            ? 'Connected to QZ Tray'
            : 'Not connected to QZ Tray'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="printer-select" className="text-sm font-medium">
              Select Printer
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshConnection}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <Select
            value={selectedPrinter}
            onValueChange={setSelectedPrinter}
            disabled={printers.length === 0 || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                printers.length === 0 
                  ? 'No printers available' 
                  : 'Select a printer'
              } />
            </SelectTrigger>
            <SelectContent>
              {printers.map((printer) => (
                <SelectItem key={printer} value={printer}>
                  {printer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={handlePrintTest}
          disabled={!isConnected || !selectedPrinter || isPrinting}
        >
          {isPrinting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Printing...
            </>
          ) : (
            'Print Test Page'
          )}
        </Button>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Make sure QZ Tray is running on your computer.</p>
          <p>Download it from <a href="https://qz.io/download" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">qz.io/download</a></p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QZTrayStatus;

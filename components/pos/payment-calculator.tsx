'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface PaymentCalculatorProps {
  totalAmount: number;
  onPaymentComplete: (amountPaid: number, change: number) => void;
  onCancel: () => void;
}

export function PaymentCalculator({ totalAmount, onPaymentComplete, onCancel }: PaymentCalculatorProps) {
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const paid = parseFloat(amountPaid) || 0;
    const calculatedChange = paid - totalAmount;
    setChange(calculatedChange);
    setIsValid(paid >= totalAmount);
  }, [amountPaid, totalAmount]);

  const handleNumberInput = (value: string) => {
    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmountPaid(value);
    }
  };

  const handleNumberButton = (num: number | string) => {
    if (num === 'C') {
      setAmountPaid('');
      return;
    }
    
    if (num === '.' && amountPaid.includes('.')) {
      return; // Prevent multiple decimal points
    }
    
    if (num === '.' && amountPaid === '') {
      setAmountPaid('0.');
      return;
    }
    
    setAmountPaid(prev => prev + num.toString());
  };

  const handleComplete = () => {
    if (isValid) {
      onPaymentComplete(parseFloat(amountPaid), change);
    }
  };

  // Use a more compact number pad layout
  const numberButtons = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['.', 0, 'C']
  ];

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-center text-lg">Cash Payment</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Label htmlFor="total" className="text-sm">Total Amount</Label>
            <Input
              id="total"
              value={formatCurrency(totalAmount)}
              readOnly
              className="w-40 text-right border-0 font-bold p-1 h-8 text-sm"
            />
          </div>
          <div className="flex justify-between items-center">
            <Label htmlFor="paid" className="text-sm">Amount Paid</Label>
            <Input
              id="paid"
              value={amountPaid}
              onChange={(e) => handleNumberInput(e.target.value)}
              placeholder="0.00"
              className="w-40 text-right border-0 font-bold p-1 h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {numberButtons.map((row, rowIndex) => (
            <div key={rowIndex} className="contents">
              {row.map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  size="sm"
                  className="h-10 text-base"
                  onClick={() => handleNumberButton(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <Label className="text-sm">Change</Label>
          <Input
            value={formatCurrency(change >= 0 ? change : 0)}
            readOnly
            className={`w-40 text-right border-0 font-bold p-1 h-8 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          />
        </div>

        {change < 0 && (
          <p className="text-red-500 text-sm text-center">
            Amount paid is less than the total amount
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!isValid}
            onClick={handleComplete}
          >
            Complete Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow, format } from 'date-fns';
import { shiftApi } from '@/lib/shift-api';

export default function ShiftManagementPage() {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState<string | null>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const userId = 'CURRENT_USER_ID'; // replace with actual logged-in user ID

  // Load existing shifts
  const loadShifts = async () => {
    const res = await shiftApi.getMyShifts(); // Use getMyShifts for current user's shifts
    setShifts(res.data.data);
    const activeShift = res.data.data.find((s: any) => s.status === 'ACTIVE');
    if (activeShift) {
      setIsShiftActive(true);
      setShiftStartTime(activeShift.startTime);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const handleStartShift = async () => {
    await shiftApi.startShift(); // No userId needed - uses current authenticated user
    setIsShiftActive(true);
    setShiftStartTime(new Date().toISOString());
    loadShifts();
  };

  const handleEndShift = async () => {
    await shiftApi.endShift(); // No userId needed - uses current authenticated user
    setIsShiftActive(false);
    setShiftStartTime(null);
    loadShifts();
  };

  const getElapsedTime = () => {
    if (!shiftStartTime) return '';
    return formatDistanceToNow(new Date(shiftStartTime), { includeSeconds: true });
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="max-w-md mx-auto shadow-lg rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-center text-lg font-semibold">
            Shift Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {isShiftActive ? (
            <>
              <p className="text-green-600 font-medium">Shift Active</p>
              <p className="text-sm text-gray-600">
                Started: {format(new Date(shiftStartTime!), 'hh:mm a')}
              </p>
              <p className="text-gray-800 font-semibold">
                Elapsed: {getElapsedTime()}
              </p>
              <Button variant="destructive" onClick={handleEndShift}>
                End Shift
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-500">No active shift</p>
              <Button onClick={handleStartShift}>Start Shift</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Shift History</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="border-b">
              <tr>
                <th className="py-2 px-3">Start</th>
                <th className="py-2 px-3">End</th>
                <th className="py-2 px-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id} className="border-b">
                  <td className="py-2 px-3">{format(new Date(shift.startTime), 'PPpp')}</td>
                  <td className="py-2 px-3">
                    {shift.endTime ? format(new Date(shift.endTime), 'PPpp') : '—'}
                  </td>
                  <td className="py-2 px-3">
                    {shift.totalHours ? `${Math.round(shift.totalHours * 60)} min` : 'In progress'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

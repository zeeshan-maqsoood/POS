'use client';

import { QZTrayStatus } from '@/components/qztray/QZTrayStatus';

export default function PrintTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold mb-8">QZ Tray Test</h1>
        <QZTrayStatus />
      </div>
    </div>
  );
}

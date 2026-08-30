'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { WifiOff, AlertTriangle } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline } = useAuth();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm sticky top-0 z-40">
      <WifiOff className="w-4 h-4" />
      <span>
        You are currently in <strong>Offline Field Mode</strong>. You can continue taking orders; drafts will automatically sync once your connection is restored.
      </span>
    </div>
  );
}

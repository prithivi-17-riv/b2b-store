'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WarehousesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inventory');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-slate-400">
      Redirecting to Inventory & Batches...
    </div>
  );
}

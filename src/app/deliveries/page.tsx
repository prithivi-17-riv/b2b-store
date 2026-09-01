'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeliveriesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/orders');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-slate-400">
      Redirecting to Orders...
    </div>
  );
}

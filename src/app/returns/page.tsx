'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReturnsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/invoices');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-slate-400">
      Redirecting to GST Invoices...
    </div>
  );
}

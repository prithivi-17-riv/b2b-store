'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OutstandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customers');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-slate-400">
      Redirecting to Customer Directory...
    </div>
  );
}

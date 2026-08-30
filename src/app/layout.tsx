import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'Annapoorna B2B | Wholesale Distribution & GST Billing System',
  description: 'Enterprise B2B grocery wholesale, field sales order booking, inventory batch tracking, and GST billing platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900 bg-slate-50">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}

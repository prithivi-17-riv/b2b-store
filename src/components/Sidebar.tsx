'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  Tag,
  ShoppingCart,
  Receipt,
  Warehouse,
  Boxes,
  CreditCard,
  AlertCircle,
  RotateCcw,
  Truck,
  BarChart3,
  FileSpreadsheet,
  Settings,
  PlusCircle,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
  badge?: string;
  highlight?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SALES_EMPLOYEE', 'WAREHOUSE_STAFF', 'DELIVERY_STAFF'] },
  { name: '+ Create Order', href: '/orders/new', icon: PlusCircle, roles: ['ADMIN', 'SALES_EMPLOYEE'], highlight: true },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['ADMIN', 'SALES_EMPLOYEE', 'WAREHOUSE_STAFF'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['ADMIN', 'SALES_EMPLOYEE'] },
  { name: 'GST Invoices', href: '/invoices', icon: Receipt, roles: ['ADMIN', 'SALES_EMPLOYEE'] },
  { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['ADMIN', 'SALES_EMPLOYEE'] },
  { name: 'Products Master', href: '/products', icon: Package, roles: ['ADMIN', 'SALES_EMPLOYEE', 'WAREHOUSE_STAFF'] },
  { name: 'Price Categories', href: '/pricing', icon: Tag, roles: ['ADMIN'] },
  { name: 'Inventory & Batches', href: '/inventory', icon: Boxes, roles: ['ADMIN', 'WAREHOUSE_STAFF'] },
  { name: 'Reports & GSTR-1', href: '/reports', icon: BarChart3, roles: ['ADMIN'] },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck, roles: ['ADMIN'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const userRole = user?.role || 'ADMIN';
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Company Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight truncate">Annapoorna B2B</h1>
            <p className="text-xs text-emerald-400 font-medium truncate">Wholesale & GST Billing</p>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-3 mx-3 my-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Admin User'}</p>
              <span className={clsx(
                'inline-block px-1.5 py-0.5 mt-0.5 text-[10px] font-bold rounded',
                userRole === 'ADMIN' && 'bg-purple-900/60 text-purple-300 border border-purple-700',
                userRole === 'SALES_EMPLOYEE' && 'bg-blue-900/60 text-blue-300 border border-blue-700',
                userRole === 'WAREHOUSE_STAFF' && 'bg-amber-900/60 text-amber-300 border border-amber-700',
                userRole === 'DELIVERY_STAFF' && 'bg-teal-900/60 text-teal-300 border border-teal-700',
              )}>
                {userRole.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/orders/new');
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  item.highlight
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm my-2'
                    : isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold border-l-4 border-emerald-500 rounded-l-none'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                )}
              >
                <Icon className={clsx('w-4 h-4 shrink-0', item.highlight ? 'text-white' : isActive ? 'text-emerald-400' : 'text-slate-400')} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer with logout and quick role switcher */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>GSTIN: 33AAACA1234A1Z5</span>
            <span className="text-emerald-400">Coimbatore</span>
          </div>
        </div>
      </aside>
    </>
  );
}

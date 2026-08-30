'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  ShoppingCart,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  Truck,
  FileText,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import clsx from 'clsx';

const STATUS_TABS = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Stock Reserved', value: 'STOCK_RESERVED' },
  { label: 'Packed', value: 'PACKED' },
  { label: 'Dispatched', value: 'DISPATCHED' },
  { label: 'Delivered', value: 'DELIVERED' },
];

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, searchQuery]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `/api/orders?q=${encodeURIComponent(searchQuery)}`;
      if (activeTab !== 'ALL') {
        url += `&status=${activeTab}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Wholesale Orders</h1>
          <p className="text-xs text-slate-500">Track and manage lifecycle from order submission to warehouse dispatch</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'SALES_EMPLOYEE') && (
          <Link
            href="/orders/new"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Order</span>
          </Link>
        )}
      </div>

      {/* Search & Status Tabs */}
      <div className="space-y-3">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Order #, Store Name, Customer Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 focus:outline-hidden bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shadow-2xs',
                activeTab === tab.value
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No orders found matching the filter</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Order Number</th>
                  <th className="p-3.5">Customer / Store</th>
                  <th className="p-3.5">Price Tier</th>
                  <th className="p-3.5">Sales Officer</th>
                  <th className="p-3.5 text-right">Items & Qty</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <Link href={`/orders/${o.id}`} className="font-bold text-slate-900 hover:text-emerald-600 block">
                        {o.orderNumber}
                      </Link>
                      <span className="text-[11px] text-slate-400">{new Date(o.orderDate).toLocaleDateString()}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 block">{o.customer?.storeName}</span>
                      <span className="text-[11px] text-slate-400">{o.customer?.city}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {o.priceCategory?.name}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-700 font-medium">{o.salesEmployee?.name}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="font-bold text-slate-800">{o.itemCount} items</span>
                      <span className="block text-[11px] text-slate-400">{o.totalQuantity} Units</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="font-bold text-slate-900 text-sm">{formatIndianCurrency(o.grandTotal)}</span>
                      {o.invoice && (
                        <span className="block text-[10px] text-emerald-600 font-semibold">
                          Inv: {o.invoice.invoiceNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={clsx(
                        'inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        o.status === 'DELIVERED' && 'bg-emerald-100 text-emerald-800',
                        o.status === 'DISPATCHED' && 'bg-purple-100 text-purple-800',
                        o.status === 'PACKED' && 'bg-indigo-100 text-indigo-800',
                        o.status === 'STOCK_RESERVED' && 'bg-amber-100 text-amber-800',
                        o.status === 'APPROVED' && 'bg-blue-100 text-blue-800',
                        o.status === 'SUBMITTED' && 'bg-amber-50 text-amber-700 border border-amber-300',
                        o.status === 'DRAFT' && 'bg-slate-100 text-slate-600',
                      )}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <Link
                        href={`/orders/${o.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

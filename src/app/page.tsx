'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Users,
  Building,
} from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const today = data?.today || { sales: 0, orders: 0 };
  const ordersSummary = data?.ordersSummary || {};
  const stats = data?.stats || { totalCustomers: 0 };
  const recentOrders = data?.recentOrders || [];
  const employeePerformance = data?.employeePerformance || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Welcome back, {user?.name || 'User'}</h1>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-400/30">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time B2B Wholesale Distribution & GST Billing Overview
          </p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'SALES_EMPLOYEE') && (
          <Link
            href="/orders/new"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Bulk Order</span>
          </Link>
        )}
      </div>

      {/* Primary KPI Cards (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatIndianCurrency(today.sales)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{today.orders} orders booked today</span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Orders</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {ordersSummary.active || 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{ordersSummary.delivered || 0} orders delivered</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Stores</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalCustomers || 0} Stores
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-600 font-medium">
            <Building className="w-3.5 h-3.5" />
            <span>Supermarkets & Retail Partners</span>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Recent Orders & Sales Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Wholesale Orders</h2>
              <p className="text-xs text-slate-500">Live order status and GST invoice readiness</p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No recent orders recorded</div>
            ) : (
              recentOrders.map((o: any) => (
                <div key={o.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/orders/${o.id}`} className="text-xs font-bold text-slate-900 hover:text-emerald-600 truncate">
                        {o.orderNumber}
                      </Link>
                      {o.priceCategory?.name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {o.priceCategory.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                      {o.customer?.storeName} • <span className="text-slate-400">{o.customer?.city}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Rep: {o.salesEmployee?.name} • {new Date(o.orderDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatIndianCurrency(o.grandTotal)}</p>
                    <span className={clsx(
                      'inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider',
                      o.status === 'DELIVERED' && 'bg-emerald-100 text-emerald-800',
                      o.status === 'CONFIRMED' && 'bg-blue-100 text-blue-800',
                      o.status === 'CANCELLED' && 'bg-red-100 text-red-800',
                      !['DELIVERED', 'CONFIRMED', 'CANCELLED'].includes(o.status) && 'bg-slate-100 text-slate-700'
                    )}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Sales Performance Activity */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Sales Team Activity</h2>
              <p className="text-xs text-slate-500">Representative performance</p>
            </div>
            <div className="divide-y divide-slate-100">
              {employeePerformance.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No representative data yet</div>
              ) : (
                employeePerformance.map((emp: any) => (
                  <div key={emp.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{emp.name}</p>
                      <p className="text-[11px] text-slate-400">{emp.orderCount} orders booked</p>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatIndianCurrency(emp.totalSales)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

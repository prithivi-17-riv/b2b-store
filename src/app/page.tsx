'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  AlertCircle,
  PackageX,
  Truck,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Users,
  Building,
  DollarSign,
  AlertTriangle,
  Calendar,
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
  const finance = data?.finance || { totalOutstanding: 0, nearLimitCount: 0 };
  const inventoryAlerts = data?.inventoryAlerts || { lowStockCount: 0, lowStockItems: [], expiringBatchesCount: 0, expiringBatches: [] };
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
            Real-time B2B Wholesale Distribution, Inventory Batches & GST Billing Overview
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

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Pending Orders */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {ordersSummary.pending || 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{ordersSummary.approved || 0} approved, {ordersSummary.processing || 0} in packing</span>
          </div>
        </div>

        {/* Customer Outstanding */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Outstanding</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatIndianCurrency(finance.totalOutstanding)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{finance.nearLimitCount} accounts near credit limit</span>
          </div>
        </div>

        {/* Inventory & Expiry Alerts */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Alerts</span>
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <PackageX className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {inventoryAlerts.lowStockCount || 0} Items
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{inventoryAlerts.expiringBatchesCount || 0} batches expiring soon</span>
          </div>
        </div>
      </div>

      {/* Order Pipeline & Status Progress Tracker */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Order Pipeline Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Submitted</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{ordersSummary.pending || 0}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-xs text-blue-700 font-medium">Approved</span>
            <p className="text-xl font-bold text-blue-900 mt-1">{ordersSummary.approved || 0}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <span className="text-xs text-amber-700 font-medium">Picking/Packed</span>
            <p className="text-xl font-bold text-amber-900 mt-1">{ordersSummary.processing || 0}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <span className="text-xs text-purple-700 font-medium">Dispatched</span>
            <p className="text-xl font-bold text-purple-900 mt-1">{ordersSummary.dispatched || 0}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-xs text-emerald-700 font-medium">Delivered</span>
            <p className="text-xl font-bold text-emerald-900 mt-1">{ordersSummary.delivered || 0}</p>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Recent Orders & Inventory Alerts */}
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {o.priceCategory?.name}
                      </span>
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
                      o.status === 'DISPATCHED' && 'bg-purple-100 text-purple-800',
                      o.status === 'APPROVED' && 'bg-blue-100 text-blue-800',
                      o.status === 'SUBMITTED' && 'bg-amber-100 text-amber-800',
                      o.status === 'DRAFT' && 'bg-slate-100 text-slate-700',
                    )}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Low Stock Items & Sales Performance */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Low Stock Warnings</h2>
              <Link href="/inventory" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                Inventory
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {inventoryAlerts.lowStockItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-emerald-600 font-medium">
                  ✓ All products are stocked above minimum levels
                </div>
              ) : (
                inventoryAlerts.lowStockItems.map((item: any) => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-400">Min: {item.minStockLevel} {item.uom}</p>
                    </div>
                    <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                      {item.available} {item.uom} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sales Employee Leaderboard */}
          {user?.role === 'ADMIN' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Sales Team Activity</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {employeePerformance.map((emp: any) => (
                  <div key={emp.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{emp.name}</p>
                      <p className="text-[11px] text-slate-400">{emp.orderCount} orders booked</p>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatIndianCurrency(emp.totalSales)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

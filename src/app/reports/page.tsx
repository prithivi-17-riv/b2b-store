'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  BarChart3,
  FileSpreadsheet,
  Calendar,
  Layers,
  Receipt,
  TrendingUp,
  Download,
  Users,
  Package,
} from 'lucide-react';
import clsx from 'clsx';

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<'sales' | 'gst'>('sales');
  const [period, setPeriod] = useState('30days');
  const [salesData, setSalesData] = useState<any>(null);
  const [gstData, setGstData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [reportType, period]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      if (reportType === 'sales') {
        const res = await fetch(`/api/reports/sales?period=${period}`);
        if (res.ok) {
          const d = await res.json();
          setSalesData(d);
        }
      } else {
        const res = await fetch(`/api/reports/gst?period=${period}`);
        if (res.ok) {
          const d = await res.json();
          setGstData(d);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Business & GST Reports</h1>
          <p className="text-xs text-slate-500">Comprehensive sales breakdown, GSTR-1 returns, and HSN analysis</p>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-2">
          {['today', '7days', '30days', 'all'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors',
                period === p
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              )}
            >
              {p === 'today' ? 'Today' : p === '7days' ? 'Last 7 Days' : p === '30days' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Report Category Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportType('sales')}
          className={clsx(
            'flex items-center gap-2 pb-2 text-xs font-bold transition-colors border-b-2',
            reportType === 'sales'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales & Revenue Analytics</span>
        </button>

        <button
          onClick={() => setReportType('gst')}
          className={clsx(
            'flex items-center gap-2 pb-2 text-xs font-bold transition-colors border-b-2',
            reportType === 'gst'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>GSTR-1 Tax Summary & HSN Report</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Compiling financial analytics...</div>
      ) : reportType === 'sales' && salesData ? (
        /* SALES REPORT SUITE */
        <div className="space-y-6">
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total B2B Revenue</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatIndianCurrency(salesData.summary?.totalSales)}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{salesData.summary?.orderCount} orders booked</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Taxable Value</span>
              <p className="text-2xl font-black text-slate-700 mt-1">{formatIndianCurrency(salesData.summary?.totalTaxable)}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total GST Collected</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatIndianCurrency((salesData.summary?.totalCgst || 0) + (salesData.summary?.totalSgst || 0) + (salesData.summary?.totalIgst || 0))}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Order Value</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatIndianCurrency(salesData.summary?.averageOrderValue)}</p>
            </div>
          </div>

          {/* Grid: Sales by Category & Sales by Price Tier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revenue by Product Category</h2>
              <div className="divide-y divide-slate-100">
                {salesData.categorySales?.map((c: any) => (
                  <div key={c.categoryName} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{c.categoryName}</p>
                      <p className="text-[11px] text-slate-400">{c.quantity} units sold</p>
                    </div>
                    <span className="font-bold text-slate-900">{formatIndianCurrency(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Category Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Revenue by Price Tier</h2>
              <div className="divide-y divide-slate-100">
                {salesData.priceCategorySales?.map((p: any) => (
                  <div key={p.priceCategoryName} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{p.priceCategoryName} Tier</p>
                      <p className="text-[11px] text-slate-400">{p.orders} orders</p>
                    </div>
                    <span className="font-bold text-slate-900">{formatIndianCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Top Performing Grocery Products</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5 text-right">Quantity Sold</th>
                    <th className="p-3.5 text-right">Revenue Generated (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesData.productSales?.map((prod: any) => (
                    <tr key={prod.productName} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{prod.productName}</td>
                      <td className="p-3.5 text-right font-medium text-slate-700">
                        {prod.quantity} {prod.uom}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 text-sm">
                        {formatIndianCurrency(prod.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : gstData ? (
        /* GSTR-1 REPORT SUITE */
        <div className="space-y-6">
          {/* GST Summary Header Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total B2B Invoices</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{gstData.summary?.totalInvoices}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{gstData.company?.gstin}</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Taxable Value</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatIndianCurrency(gstData.summary?.totalTaxable)}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CGST + SGST (Intrastate)</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatIndianCurrency((gstData.summary?.totalCgst || 0) + (gstData.summary?.totalSgst || 0))}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">
                CGST: {formatIndianCurrency(gstData.summary?.totalCgst)} | SGST: {formatIndianCurrency(gstData.summary?.totalSgst)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IGST (Interstate)</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{formatIndianCurrency(gstData.summary?.totalIgst)}</p>
            </div>
          </div>

          {/* HSN-Wise Summary Table (GSTR-1 Table 12 format) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Table 12: HSN-Wise Summary of Outward Supplies</h2>
                <p className="text-xs text-slate-500">Required format for Indian GST filing (GSTR-1)</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">HSN / SAC</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">UOM</th>
                    <th className="p-3.5 text-right">Total Qty</th>
                    <th className="p-3.5 text-right">Taxable Value (₹)</th>
                    <th className="p-3.5 text-center">Rate</th>
                    <th className="p-3.5 text-right">CGST (₹)</th>
                    <th className="p-3.5 text-right">SGST (₹)</th>
                    <th className="p-3.5 text-right">IGST (₹)</th>
                    <th className="p-3.5 text-right">Total Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gstData.hsnSummary?.map((h: any) => (
                    <tr key={h.hsnCode} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{h.hsnCode}</td>
                      <td className="p-3.5 text-slate-800 font-medium">{h.description}</td>
                      <td className="p-3.5 text-slate-500 uppercase font-bold text-[10px]">{h.uom}</td>
                      <td className="p-3.5 text-right font-medium text-slate-800">{h.totalQuantity}</td>
                      <td className="p-3.5 text-right font-semibold text-slate-900">{formatIndianCurrency(h.taxableAmount)}</td>
                      <td className="p-3.5 text-center font-semibold text-emerald-700">{h.gstRate}%</td>
                      <td className="p-3.5 text-right text-slate-600">{formatIndianCurrency(h.cgstAmount)}</td>
                      <td className="p-3.5 text-right text-slate-600">{formatIndianCurrency(h.sgstAmount)}</td>
                      <td className="p-3.5 text-right text-blue-700 font-medium">{formatIndianCurrency(h.igstAmount)}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">{formatIndianCurrency(h.cgstAmount + h.sgstAmount + h.igstAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rate-Wise Summary Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">GST Slab-Wise Distribution</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Tax Slab Rate</th>
                    <th className="p-3.5 text-right">Taxable Sales (₹)</th>
                    <th className="p-3.5 text-right">CGST (₹)</th>
                    <th className="p-3.5 text-right">SGST (₹)</th>
                    <th className="p-3.5 text-right">IGST (₹)</th>
                    <th className="p-3.5 text-right">Total Invoice Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gstData.rateSummary?.map((r: any) => (
                    <tr key={r.rate} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-emerald-700">GST {r.rate}% Slab</td>
                      <td className="p-3.5 text-right font-semibold text-slate-900">{formatIndianCurrency(r.taxable)}</td>
                      <td className="p-3.5 text-right text-slate-600">{formatIndianCurrency(r.cgst)}</td>
                      <td className="p-3.5 text-right text-slate-600">{formatIndianCurrency(r.sgst)}</td>
                      <td className="p-3.5 text-right text-blue-700 font-medium">{formatIndianCurrency(r.igst)}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">{formatIndianCurrency(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

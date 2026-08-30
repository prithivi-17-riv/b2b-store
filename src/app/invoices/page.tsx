'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  Receipt,
  Search,
  FileText,
  CreditCard,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import clsx from 'clsx';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, searchQuery]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `/api/invoices?q=${encodeURIComponent(searchQuery)}`;
      if (statusFilter !== 'ALL') {
        url += `&paymentStatus=${statusFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
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
          <h1 className="text-xl font-bold text-slate-900">GST Tax Invoices</h1>
          <p className="text-xs text-slate-500">Official Indian B2B tax invoices with HSN breakdowns & payment tracking</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Invoice #, Store Name, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 focus:outline-hidden bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
          {['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xs',
                statusFilter === status
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              )}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No GST invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice Number</th>
                  <th className="p-3.5">Date & Due Date</th>
                  <th className="p-3.5">Customer Store</th>
                  <th className="p-3.5">Customer GSTIN</th>
                  <th className="p-3.5 text-right">Taxable (₹)</th>
                  <th className="p-3.5 text-right">Grand Total (₹)</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <Link href={`/invoices/${inv.id}`} className="font-bold text-slate-900 hover:text-emerald-600 block">
                        {inv.invoiceNumber}
                      </Link>
                      {inv.order && (
                        <span className="text-[10px] text-slate-400">Ord: {inv.order.orderNumber}</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-700 font-medium block">{new Date(inv.invoiceDate).toLocaleDateString()}</span>
                      <span className="text-[10px] text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 block">{inv.customer?.storeName}</span>
                      <span className="text-[10px] text-slate-400">{inv.customer?.city}</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {inv.customerGstin || 'Unregistered'}
                    </td>
                    <td className="p-3.5 text-right text-slate-700 font-medium">
                      {formatIndianCurrency(inv.taxableAmount)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {formatIndianCurrency(inv.grandTotal)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-red-600">
                      {inv.balanceAmount > 0 ? formatIndianCurrency(inv.balanceAmount) : '₹0.00'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={clsx(
                        'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        inv.paymentStatus === 'PAID' && 'bg-emerald-100 text-emerald-800',
                        inv.paymentStatus === 'PARTIALLY_PAID' && 'bg-amber-100 text-amber-800',
                        inv.paymentStatus === 'UNPAID' && 'bg-red-100 text-red-800',
                      )}>
                        {inv.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-semibold text-[11px] border border-emerald-200"
                        >
                          View / Print
                        </Link>
                        {inv.balanceAmount > 0 && (
                          <Link
                            href={`/payments?customerId=${inv.customerId}&invoiceId=${inv.id}`}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-semibold text-[11px]"
                          >
                            Pay
                          </Link>
                        )}
                      </div>
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

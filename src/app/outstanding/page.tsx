'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  AlertCircle,
  Search,
  CreditCard,
  Building,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import clsx from 'clsx';

export default function OutstandingPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOutstanding();
  }, [searchQuery]);

  const fetchOutstanding = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        // Sort by highest outstanding
        const sorted = (data.customers || []).sort((a: any, b: any) => b.currentOutstanding - a.currentOutstanding);
        setCustomers(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + c.currentOutstanding, 0);
  const totalCreditLimits = customers.reduce((sum, c) => sum + c.creditLimit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Outstanding & Credit Limits</h1>
          <p className="text-xs text-slate-500">Monitor receivables, aging credit exposure, and customer payment terms</p>
        </div>
      </div>

      {/* High-Level Receivables Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Receivables</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatIndianCurrency(totalOutstanding)}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{customers.length} active customer accounts</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Credit Line Offered</span>
          <p className="text-2xl font-black text-slate-700 mt-1">{formatIndianCurrency(totalCreditLimits)}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {((totalOutstanding / (totalCreditLimits || 1)) * 100).toFixed(1)}% portfolio utilization
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Risk Accounts</span>
          <p className="text-2xl font-black text-red-600 mt-1">
            {customers.filter((c) => c.currentOutstanding >= c.creditLimit * 0.85).length}
          </p>
          <span className="text-[11px] text-red-500 mt-0.5 block">Accounts &gt; 85% credit utilization</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search customer by store name, owner, phone or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs text-slate-800 focus:outline-hidden bg-transparent"
        />
      </div>

      {/* Customer Outstanding Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading outstanding ledger summary...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No customer records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Customer / Store</th>
                  <th className="p-3.5">City & Rep</th>
                  <th className="p-3.5">Terms (Days)</th>
                  <th className="p-3.5 text-right">Credit Limit</th>
                  <th className="p-3.5 text-right">Outstanding (Due)</th>
                  <th className="p-3.5 text-right">Available Credit</th>
                  <th className="p-3.5 text-center">Credit Health</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const utilization = (c.currentOutstanding / (c.creditLimit || 1)) * 100;
                  const available = Math.max(0, c.creditLimit - c.currentOutstanding);
                  const isOver = c.currentOutstanding > c.creditLimit;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <Link href={`/customers/${c.id}`} className="font-bold text-slate-900 hover:text-emerald-600 block">
                          {c.storeName}
                        </Link>
                        <span className="text-[11px] text-slate-400">{c.customerCode} • {c.ownerName}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-800 font-medium block">{c.city}</span>
                        <span className="text-[11px] text-slate-400">{c.assignedEmployee?.name || 'Unassigned'}</span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {c.paymentTermsDays} Days
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-600">
                        {formatIndianCurrency(c.creditLimit)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-sm">
                        <span className={clsx(isOver ? 'text-red-600' : 'text-slate-900')}>
                          {formatIndianCurrency(c.currentOutstanding)}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-700">
                        {formatIndianCurrency(available)}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="w-24 mx-auto">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                            <span>{utilization.toFixed(0)}%</span>
                            {isOver && <span className="text-red-500">Exceeded</span>}
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full',
                                isOver ? 'bg-red-600' : utilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              style={{ width: `${Math.min(100, utilization)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/customers/${c.id}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                          >
                            Ledger
                          </Link>
                          {c.currentOutstanding > 0 && (
                            <Link
                              href={`/payments?customerId=${c.id}`}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px]"
                            >
                              Collect
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

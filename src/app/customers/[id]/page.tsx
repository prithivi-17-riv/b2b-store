'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  ShoppingCart,
  Receipt,
  RotateCcw,
  PlusCircle,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ledger' | 'invoices' | 'orders' | 'payments' | 'creditNotes'>('ledger');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
    fetchLedger();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const json = await res.json();
        setCustomer(json.customer);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch(`/api/customers/${id}/ledger`);
      if (res.ok) {
        const json = await res.json();
        setLedger(json.ledgerEntries || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading customer profile & ledger...</div>;
  }

  if (!customer) {
    return <div className="p-12 text-center text-xs text-slate-400">Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link href="/customers" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/orders/new?customerId=${customer.id}`}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Order</span>
          </Link>
          <Link
            href={`/payments?customerId=${customer.id}`}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Customer 360 Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{customer.storeName}</h1>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs font-mono font-bold">
                {customer.customerCode}
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                {customer.customerType}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Owner: <span className="text-slate-900 font-semibold">{customer.ownerName}</span> • Assigned Field Rep: <span className="text-slate-900 font-semibold">{customer.assignedEmployee?.name || 'None'}</span>
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.phone} {customer.altPhone ? `/ ${customer.altPhone}` : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.billingAddress}, {customer.city} ({customer.stateCode})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-semibold text-slate-700">GSTIN: {customer.gstin || 'Unregistered'}</span>
              </div>
            </div>
          </div>

          {/* Account Overview Tile */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-56 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit Limit</span>
            <p className="text-lg font-black text-slate-900 mt-0.5">{formatIndianCurrency(customer.creditLimit)}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{customer.paymentTermsDays} Days Payment Terms</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={clsx('pb-2.5 transition-colors border-b-2', activeTab === 'ledger' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800')}
        >
          Customer Statement / Ledger
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={clsx('pb-2.5 transition-colors border-b-2', activeTab === 'invoices' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800')}
        >
          Tax Invoices ({customer.invoices?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={clsx('pb-2.5 transition-colors border-b-2', activeTab === 'orders' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800')}
        >
          Orders ({customer.orders?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={clsx('pb-2.5 transition-colors border-b-2', activeTab === 'payments' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800')}
        >
          Payments Received ({customer.payments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('creditNotes')}
          className={clsx('pb-2.5 transition-colors border-b-2', activeTab === 'creditNotes' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800')}
        >
          Credit Notes ({customer.creditNotes?.length || 0})
        </button>
      </div>

      {/* Tab 1: Ledger Statement */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Chronological Account Ledger</h2>
              <p className="text-xs text-slate-500">Every Debit (Invoice) and Credit (Payment / Credit Note) with Running Balance</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Print Statement
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Transaction Type</th>
                  <th className="p-3.5">Reference #</th>
                  <th className="p-3.5">Particulars / Notes</th>
                  <th className="p-3.5 text-right">Debit (Dr)</th>
                  <th className="p-3.5 text-right">Credit (Cr)</th>
                  <th className="p-3.5 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No ledger entries recorded yet</td>
                  </tr>
                ) : (
                  ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 text-slate-700 whitespace-nowrap">
                        {new Date(entry.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span className={clsx(
                          'inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          entry.type === 'INVOICE' && 'bg-blue-50 text-blue-700 border border-blue-200',
                          entry.type === 'PAYMENT' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                          entry.type === 'CREDIT_NOTE' && 'bg-purple-50 text-purple-700 border border-purple-200',
                          entry.type === 'OPENING_BALANCE' && 'bg-slate-100 text-slate-700'
                        )}>
                          {entry.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] font-semibold text-slate-800">
                        {entry.referenceNumber || '-'}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        {entry.notes || '-'}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-900">
                        {entry.debitAmount > 0 ? formatIndianCurrency(entry.debitAmount) : '-'}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-emerald-600">
                        {entry.creditAmount > 0 ? formatIndianCurrency(entry.creditAmount) : '-'}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {formatIndianCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {customer.invoices?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No invoices generated yet</div>
            ) : (
              customer.invoices.map((inv: any) => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <Link href={`/invoices/${inv.id}`} className="text-xs font-bold text-slate-900 hover:text-emerald-600">
                      {inv.invoiceNumber}
                    </Link>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Date: {new Date(inv.invoiceDate).toLocaleDateString()} • Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{formatIndianCurrency(inv.grandTotal)}</p>
                    <span className={clsx(
                      'inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase mt-0.5',
                      inv.paymentStatus === 'PAID' && 'bg-emerald-100 text-emerald-800',
                      inv.paymentStatus === 'PARTIALLY_PAID' && 'bg-amber-100 text-amber-800',
                      inv.paymentStatus === 'UNPAID' && 'bg-red-100 text-red-800',
                    )}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {customer.orders?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No orders booked yet</div>
            ) : (
              customer.orders.map((ord: any) => (
                <div key={ord.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <Link href={`/orders/${ord.id}`} className="text-xs font-bold text-slate-900 hover:text-emerald-600">
                      {ord.orderNumber}
                    </Link>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tier: {ord.priceCategory?.name} • {new Date(ord.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{formatIndianCurrency(ord.grandTotal)}</p>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">{ord.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {customer.payments?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No payments recorded</div>
            ) : (
              customer.payments.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.paymentNumber}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Method: {p.paymentMethod} • Ref: {p.referenceNumber || 'N/A'} • {new Date(p.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-emerald-600">{formatIndianCurrency(p.amount)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Credit Notes */}
      {activeTab === 'creditNotes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {customer.creditNotes?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No credit notes issued</div>
            ) : (
              customer.creditNotes.map((cn: any) => (
                <div key={cn.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{cn.creditNoteNumber}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(cn.date).toLocaleDateString()} • {cn.notes}</p>
                  </div>
                  <p className="text-xs font-bold text-purple-700">{formatIndianCurrency(cn.grandTotal)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

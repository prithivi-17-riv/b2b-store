'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  CreditCard,
  Search,
  PlusCircle,
  CheckCircle2,
  DollarSign,
  Building,
  Calendar,
  X,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';

import { Suspense } from 'react';

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Payments...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}

function PaymentsContent() {
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId');
  const initialInvoiceId = searchParams.get('invoiceId');
  const { user } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(Boolean(initialCustomerId || initialInvoiceId));

  // Form State
  const [formData, setFormData] = useState({
    customerId: initialCustomerId || '',
    invoiceId: initialInvoiceId || '',
    amount: '',
    paymentMethod: 'UPI',
    referenceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchCustomersAndInvoices();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAndInvoices = async () => {
    try {
      const [cRes, iRes] = await Promise.all([fetch('/api/customers'), fetch('/api/invoices?paymentStatus=UNPAID')]);
      if (cRes.ok) {
        const cd = await cRes.json();
        setCustomers(cd.customers || []);
      }
      if (iRes.ok) {
        const id = await iRes.json();
        setInvoices(id.invoices || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchPayments();
        setFormData({
          customerId: '',
          invoiceId: '',
          amount: '',
          paymentMethod: 'UPI',
          referenceNumber: '',
          paymentDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to record payment');
      }
    } catch {
      alert('Error recording payment');
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments & Collections</h1>
          <p className="text-xs text-slate-500">Record settlements across UPI, Cash, Bank Transfer, and Cheques</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Collections</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{formatIndianCurrency(totalCollected)}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{payments.length} payments recorded</span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No payment records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Payment #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Invoice Ref</th>
                  <th className="p-3.5">Method & Reference</th>
                  <th className="p-3.5">Received By</th>
                  <th className="p-3.5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="p-3.5 text-slate-700">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{p.customer?.storeName}</td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {p.invoice ? p.invoice.invoiceNumber : 'On-Account'}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                      {p.referenceNumber && (
                        <span className="block font-mono text-[10px] text-slate-400">{p.referenceNumber}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{p.receivedByUser?.name || 'Field Officer'}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-700 text-sm">
                      {formatIndianCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Record Customer Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                >
                  <option value="">-- Choose Customer Store --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.storeName} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link to Invoice (Optional)</label>
                <select
                  value={formData.invoiceId}
                  onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">-- On-Account Payment / All Invoices --</option>
                  {invoices
                    .filter((inv) => !formData.customerId || inv.customerId === formData.customerId)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} (Bal: ₹{inv.balanceAmount?.toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-emerald-800"
                    placeholder="e.g. 50000"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference / UTR / Cheque #</label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                    placeholder="UPI/20260829/..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Collected on visit by field sales rep..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

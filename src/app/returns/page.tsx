'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  RotateCcw,
  FileText,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  X,
} from 'lucide-react';
import clsx from 'clsx';

export default function ReturnsPage() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'returns' | 'creditNotes'>('returns');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Return Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [reason, setReason] = useState('DAMAGED');
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchReturns();
    fetchCreditNotes();
    fetchInvoices();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/returns');
      if (res.ok) {
        const data = await res.json();
        setReturns(data.returns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditNotes = async () => {
    try {
      const res = await fetch('/api/credit-notes');
      if (res.ok) {
        const data = await res.json();
        setCreditNotes(data.creditNotes || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvoiceSelect = async (invId: string) => {
    setSelectedInvoiceId(invId);
    if (!invId) {
      setSelectedInvoice(null);
      setReturnItems([]);
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${invId}`);
      if (res.ok) {
        const d = await res.json();
        setSelectedInvoice(d.invoice);
        setReturnItems(
          d.invoice.items.map((it: any) => ({
            productId: it.productId,
            productName: it.productName,
            uom: it.uom,
            maxQty: it.quantity,
            quantity: 0,
            unitRate: it.unitRate,
            gstRate: it.gstRate,
            isRestockedToWarehouse: false,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeItems = returnItems.filter((i) => i.quantity > 0);
    if (activeItems.length === 0) {
      alert('Please enter a return quantity for at least one item');
      return;
    }

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          reason,
          items: activeItems,
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchReturns();
        fetchCreditNotes();
        setSelectedInvoiceId('');
        setSelectedInvoice(null);
        setReturnItems([]);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit return');
      }
    } catch {
      alert('Error submitting return');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Returns & Credit Notes</h1>
          <p className="text-xs text-slate-500">Handle damaged/expired goods inward, return approvals, and GST credit notes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise Return Request</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('returns')}
          className={clsx(
            'px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors',
            activeTab === 'returns' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          )}
        >
          Return Requests ({returns.length})
        </button>
        <button
          onClick={() => setActiveTab('creditNotes')}
          className={clsx(
            'px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors',
            activeTab === 'creditNotes' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          )}
        >
          Issued Credit Notes ({creditNotes.length})
        </button>
      </div>

      {/* Tab 1: Returns Table */}
      {activeTab === 'returns' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading return requests...</div>
          ) : returns.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No return requests recorded</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Return #</th>
                    <th className="p-3.5">Invoice Ref</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Items Returned</th>
                    <th className="p-3.5 text-right">Refund Amount</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Credit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">{r.returnNumber}</td>
                      <td className="p-3.5 font-mono text-slate-600">{r.invoice?.invoiceNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{r.customer?.storeName}</td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-700">{r.reason.replace('_', ' ')}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {r.items?.map((it: any) => (
                          <span key={it.id} className="block text-[11px]">
                            {it.product?.name}: <strong>{it.quantity}</strong>
                          </span>
                        ))}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 text-sm">
                        {formatIndianCurrency(r.totalRefundAmount)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={clsx(
                          'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        )}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-semibold text-purple-700">
                        {r.creditNote ? r.creditNote.creditNoteNumber : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Credit Notes Table */}
      {activeTab === 'creditNotes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Credit Note #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Original Invoice</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5 text-right">Taxable Value</th>
                  <th className="p-3.5 text-right">GST Adjusted</th>
                  <th className="p-3.5 text-right">Credit Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditNotes.map((cn) => (
                  <tr key={cn.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold font-mono text-purple-800">{cn.creditNoteNumber}</td>
                    <td className="p-3.5 text-slate-600">{new Date(cn.date).toLocaleDateString()}</td>
                    <td className="p-3.5 font-mono text-slate-700">{cn.invoice?.invoiceNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{cn.customer?.storeName}</td>
                    <td className="p-3.5 text-right font-medium text-slate-700">{formatIndianCurrency(cn.amount)}</td>
                    <td className="p-3.5 text-right font-medium text-emerald-700">{formatIndianCurrency(cn.taxAmount)}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900 text-sm">{formatIndianCurrency(cn.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raise Return Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Raise Product Return Request</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Original Invoice *</label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                >
                  <option value="">-- Choose Invoice --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customer?.storeName} (₹{inv.grandTotal.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Return *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold"
                >
                  <option value="DAMAGED">Damaged Goods in Transit</option>
                  <option value="EXPIRED">Near Expiry / Expired on Delivery</option>
                  <option value="WRONG_PRODUCT">Wrong Product Delivered</option>
                  <option value="WRONG_QUANTITY">Quantity Discrepancy</option>
                  <option value="CUSTOMER_REJECTION">Customer Rejection / Order Dispute</option>
                  <option value="OTHER">Other Reason</option>
                </select>
              </div>

              {/* Items in Selected Invoice */}
              {returnItems.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-2">Specify Return Quantities:</label>
                  <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-56 overflow-y-auto">
                    {returnItems.map((it, idx) => (
                      <div key={it.productId} className="flex items-center justify-between gap-3 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{it.productName}</p>
                          <p className="text-[11px] text-slate-400">
                            Billed: {it.maxQty} {it.uom} @ ₹{it.unitRate}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500">Return Qty:</span>
                            <input
                              type="number"
                              min="0"
                              max={it.maxQty}
                              value={it.quantity}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setReturnItems((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, quantity: val } : item))
                                );
                              }}
                              className="w-16 border border-slate-300 rounded-md px-2 py-1 text-center font-bold"
                            />
                          </div>

                          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={it.isRestockedToWarehouse}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setReturnItems((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, isRestockedToWarehouse: checked } : item))
                                );
                              }}
                              className="rounded text-emerald-600"
                            />
                            <span>Restock</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Return Inspection Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 5 bags of sugar damaged by rain during delivery, verified by driver..."
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
                  Authorize Return & Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

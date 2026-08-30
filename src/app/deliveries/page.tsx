'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  FileText,
  User,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

export default function DeliveriesPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Complete POD Modal State
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [recipientName, setRecipientName] = useState('');
  const [podNotes, setPodNotes] = useState('');
  const [submittingPod, setSubmittingPod] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      let url = '/api/deliveries';
      if (statusFilter !== 'ALL') {
        url += `?status=${statusFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId: string, status: string, extra: any = {}) => {
    try {
      const res = await fetch('/api/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deliveryId,
          status,
          ...extra,
        }),
      });

      if (res.ok) {
        setActiveDelivery(null);
        fetchDeliveries();
      } else {
        alert('Failed to update delivery');
      }
    } catch {
      alert('Error updating delivery');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Logistics & Delivery Fleet</h1>
          <p className="text-xs text-slate-500">Track dispatch vehicles, delivery routes, and Proof of Delivery (POD) signatures</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'DISPATCHED', 'DELIVERED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-2xs transition-colors',
              statusFilter === status
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            )}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Deliveries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 col-span-2">Loading delivery dispatches...</div>
        ) : deliveries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 col-span-2">No active deliveries in this view</div>
        ) : (
          deliveries.map((del) => {
            const isDelivered = del.status === 'DELIVERED';

            return (
              <div key={del.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{del.order?.orderNumber}</span>
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                        {del.vehicleNumber || 'Vehicle Assigned'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Driver: <strong className="text-slate-800">{del.deliveryEmployee?.name || 'Selvam K'}</strong>
                    </p>
                  </div>

                  <span className={clsx(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                    isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800 animate-pulse'
                  )}>
                    {del.status}
                  </span>
                </div>

                {/* Customer Address Details */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{del.order?.customer?.storeName}</p>
                  <div className="flex items-start gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{del.order?.customer?.deliveryAddress}, {del.order?.customer?.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{del.order?.customer?.ownerName} ({del.order?.customer?.phone})</span>
                  </div>
                </div>

                {/* Items in Vehicle */}
                <div className="text-xs border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Consignment Items ({del.order?.items?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {del.order?.items?.map((it: any) => (
                      <span key={it.id} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">
                        {it.productName}: <strong>{it.quantity} {it.uom}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Proof of Delivery Details or Action Button */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  {isDelivered ? (
                    <div className="text-xs text-emerald-700 font-medium">
                      ✓ Delivered to <strong>{del.recipientName || 'Store In-Charge'}</strong> at {del.actualDeliveryDate ? new Date(del.actualDeliveryDate).toLocaleTimeString() : ''}
                      {del.proofOfDeliveryNotes && <p className="text-[11px] text-slate-500 italic mt-0.5">"{del.proofOfDeliveryNotes}"</p>}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-slate-500">
                        Dispatched: {del.dispatchTimestamp ? new Date(del.dispatchTimestamp).toLocaleTimeString() : 'In transit'}
                      </span>
                      <button
                        onClick={() => {
                          setActiveDelivery(del);
                          setRecipientName(del.order?.customer?.ownerName || '');
                          setPodNotes('Goods received in full condition, verified against invoice.');
                        }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Record POD</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record POD Modal */}
      {activeDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Proof of Delivery (POD)</h2>
              <button onClick={() => setActiveDelivery(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store / Customer</label>
                <p className="font-bold text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {activeDelivery.order?.customer?.storeName}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Received By (Receiver Name) *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Notes / Store Stamp Details</label>
                <textarea
                  rows={2}
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setActiveDelivery(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateDeliveryStatus(activeDelivery.id, 'DELIVERED', { recipientName, proofOfDeliveryNotes: podNotes })}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

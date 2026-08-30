'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Receipt,
  FileText,
  Building,
  User,
  ShieldCheck,
  AlertTriangle,
  Boxes,
  MapPin,
  Phone,
  Printer,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Dispatch modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('TN 38 BJ 4590');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Delivery POD modal state
  const [showPodModal, setShowPodModal] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [podNotes, setPodNotes] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, extraPayload: any = {}) => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...extraPayload,
        }),
      });

      if (res.ok) {
        setShowDispatchModal(false);
        setShowPodModal(false);
        fetchOrder();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update order status');
      }
    } catch {
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-12 text-center text-xs text-slate-400">Order not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/orders" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        {/* Workflow Transition Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {order.status === 'SUBMITTED' && user?.role === 'ADMIN' && (
            <button
              onClick={() => handleStatusUpdate('APPROVED')}
              disabled={updating}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Order</span>
            </button>
          )}

          {order.status === 'APPROVED' && (user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_STAFF') && (
            <button
              onClick={() => handleStatusUpdate('STOCK_RESERVED')}
              disabled={updating}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Boxes className="w-4 h-4" />
              <span>Reserve Warehouse Stock</span>
            </button>
          )}

          {order.status === 'STOCK_RESERVED' && (user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_STAFF') && (
            <button
              onClick={() => handleStatusUpdate('PACKED')}
              disabled={updating}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Order Packed</span>
            </button>
          )}

          {order.status === 'PACKED' && (user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_STAFF') && (
            <button
              onClick={() => setShowDispatchModal(true)}
              disabled={updating}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch & Generate GST Bill</span>
            </button>
          )}

          {order.status === 'DISPATCHED' && (user?.role === 'ADMIN' || user?.role === 'DELIVERY_STAFF') && (
            <button
              onClick={() => setShowPodModal(true)}
              disabled={updating}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Delivery (POD)</span>
            </button>
          )}

          {order.invoice && (
            <Link
              href={`/invoices/${order.invoice.id}`}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>View GST Tax Invoice</span>
            </Link>
          )}
        </div>
      </div>

      {/* Order Banner Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{order.orderNumber}</h1>
              <span className={clsx(
                'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                order.status === 'DELIVERED' && 'bg-emerald-100 text-emerald-800',
                order.status === 'DISPATCHED' && 'bg-purple-100 text-purple-800',
                order.status === 'PACKED' && 'bg-indigo-100 text-indigo-800',
                order.status === 'STOCK_RESERVED' && 'bg-amber-100 text-amber-800',
                order.status === 'APPROVED' && 'bg-blue-100 text-blue-800',
                order.status === 'SUBMITTED' && 'bg-amber-50 text-amber-700 border border-amber-300',
              )}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Booked on {new Date(order.orderDate).toLocaleDateString()} at {new Date(order.orderDate).toLocaleTimeString()}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grand Total</span>
            <span className="text-2xl font-black text-slate-900">{formatIndianCurrency(order.grandTotal)}</span>
          </div>
        </div>

        {/* Customer & Price Tier Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Customer Details</span>
            <Link href={`/customers/${order.customer.id}`} className="font-bold text-slate-900 hover:text-emerald-600 block">
              {order.customer.storeName}
            </Link>
            <p className="text-slate-600 mt-0.5">{order.customer.billingAddress}, {order.customer.city}</p>
            <p className="text-slate-500 font-mono mt-0.5">GSTIN: {order.customer.gstin || 'Unregistered'}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pricing & Sales Officer</span>
            <p className="font-bold text-slate-900">Tier: {order.priceCategory?.name}</p>
            <p className="text-slate-600 mt-0.5">Sales Officer: {order.salesEmployee?.name}</p>
            <p className="text-slate-500 mt-0.5">Warehouse: {order.warehouse?.name}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Invoice & Logistics</span>
            {order.invoice ? (
              <p className="font-bold text-emerald-700">Invoice: {order.invoice.invoiceNumber}</p>
            ) : (
              <p className="text-slate-400 font-medium">Invoice will generate upon dispatch</p>
            )}
            {order.delivery ? (
              <p className="text-slate-700 mt-0.5">Vehicle: {order.delivery.vehicleNumber || 'Assigned'}</p>
            ) : (
              <p className="text-slate-400 mt-0.5">Delivery queue pending</p>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Ordered Grocery Items ({order.items?.length || 0})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">Product Description</th>
                <th className="p-3.5">HSN Code</th>
                <th className="p-3.5 text-right">Quantity</th>
                <th className="p-3.5 text-right">Rate / Unit</th>
                <th className="p-3.5 text-right">Taxable (₹)</th>
                <th className="p-3.5 text-center">GST %</th>
                <th className="p-3.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((it: any, idx: number) => (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 block">{it.productName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{it.product?.sku}</span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-700">{it.hsnCode}</td>
                  <td className="p-3.5 text-right font-bold text-slate-800">
                    {it.quantity} {it.uom}
                  </td>
                  <td className="p-3.5 text-right font-semibold text-slate-700">
                    {formatIndianCurrency(it.unitRate)}
                  </td>
                  <td className="p-3.5 text-right font-semibold text-slate-800">
                    {formatIndianCurrency(it.taxableAmount)}
                  </td>
                  <td className="p-3.5 text-center font-semibold text-emerald-700">
                    {it.gstRate}%
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900">
                    {formatIndianCurrency(it.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-4 text-xs">
          <div className="max-w-md">
            <span className="font-bold text-slate-700 block mb-1">Order Notes:</span>
            <p className="text-slate-500 italic">{order.notes || 'No special instructions recorded.'}</p>
          </div>

          <div className="w-72 space-y-1.5 text-right">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Amount:</span>
              <span className="font-semibold text-slate-900">{formatIndianCurrency(order.taxableAmount)}</span>
            </div>
            {order.cgstAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>CGST:</span>
                <span>{formatIndianCurrency(order.cgstAmount)}</span>
              </div>
            )}
            {order.sgstAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>SGST:</span>
                <span>{formatIndianCurrency(order.sgstAmount)}</span>
              </div>
            )}
            {order.igstAmount > 0 && (
              <div className="flex justify-between text-blue-600 font-medium">
                <span>IGST:</span>
                <span>{formatIndianCurrency(order.igstAmount)}</span>
              </div>
            )}
            {order.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Round Off:</span>
                <span>{order.roundOff}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-base text-emerald-800">{formatIndianCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Dispatch Order & Issue GST Invoice</h2>
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Vehicle Number *</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dispatch Notes / Route</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Route 3 Peelamedu -> Gandhipuram"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                * Confirming dispatch will automatically deduct inventory, generate GST Tax Invoice, and notify delivery staff.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('DISPATCHED', { vehicleNumber, notes: deliveryNotes })}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery Modal */}
      {showPodModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Record Proof of Delivery (POD)</h2>
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Received By (Store Manager Name) *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. K. Senthil"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Notes / Acknowledgement</label>
                <textarea
                  rows={2}
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  placeholder="e.g. All bags and cartons delivered intact, signed on delivery slip."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowPodModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('DELIVERED', { recipientName, notes: podNotes })}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Complete Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

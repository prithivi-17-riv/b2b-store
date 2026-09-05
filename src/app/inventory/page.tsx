'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  Boxes,
  Warehouse,
  Search,
  PlusCircle,
  AlertTriangle,
  Calendar,
  Layers,
  CheckCircle2,
  X,
  Clock,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';
import ProductImage from '@/components/ProductImage';

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stock' | 'batches' | 'movements'>('stock');
  const [movements, setMovements] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    warehouseId: '',
    productId: '',
    adjustmentType: 'ADD',
    quantity: '',
    reason: 'Manual Stock Count Adjustment',
    notes: '',
  });

  const [batchForm, setBatchForm] = useState({
    warehouseId: '',
    productId: '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
  });

  useEffect(() => {
    fetchInventory();
    fetchBatches();
    fetchWarehouses();
    fetchMovements();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/inventory/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data.warehouses || []);
        if (data.warehouses?.length > 0) {
          setAdjustForm((prev) => ({ ...prev, warehouseId: data.warehouses[0].id }));
          setBatchForm((prev) => ({ ...prev, warehouseId: data.warehouses[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await fetch('/api/inventory/movements');
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...adjustForm,
        warehouseId: adjustForm.warehouseId || warehouses[0]?.id,
      };
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAdjustModal(false);
        fetchInventory();
        fetchMovements();
        setAdjustForm({
          warehouseId: warehouses[0]?.id || '',
          productId: '',
          adjustmentType: 'ADD',
          quantity: '',
          reason: 'Manual Stock Count Adjustment',
          notes: '',
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to adjust stock');
      }
    } catch {
      alert('Error adjusting stock');
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...batchForm,
        warehouseId: batchForm.warehouseId || warehouses[0]?.id,
        batchNumber: batchForm.batchNumber || `BAT-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`,
      };
      const res = await fetch('/api/inventory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowBatchModal(false);
        fetchBatches();
        fetchInventory();
        setBatchForm({
          warehouseId: warehouses[0]?.id || '',
          productId: '',
          batchNumber: '',
          manufacturingDate: '',
          expiryDate: '',
          quantity: '',
          purchasePrice: '',
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to receive stock');
      }
    } catch {
      alert('Error receiving stock');
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory Stocks</h1>
          <p className="text-xs text-slate-500">Track stock levels, FEFO batches, manufacturing & expiry dates</p>
        </div>
        <div className="flex items-center gap-2">
          {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_STAFF') && (
            <>
              <button
                onClick={() => setShowBatchModal(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Receive Stock</span>
              </button>
              <button
                onClick={() => setShowAdjustModal(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Adjust Stock</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-slate-200 pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('stock')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors',
              activeTab === 'stock' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            )}
          >
            Current Stock ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors',
              activeTab === 'batches' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            )}
          >
            Batches & Expiry ({batches.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors',
              activeTab === 'movements' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            )}
          >
            Movement Audit Trail
          </button>
        </div>

        {activeTab === 'stock' && (
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-transparent focus:outline-hidden text-slate-800 w-44"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Current Stock Table */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Available Qty</th>
                  <th className="p-3.5 text-right">Reserved</th>
                  <th className="p-3.5 text-right">Dispatched</th>
                  <th className="p-3.5 text-right">Stock Valuation</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => (
                  <tr key={item.product.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <ProductImage src={item.product.imageUrl} alt={item.product.name} size="sm" />
                        <div>
                          <span className="font-bold text-slate-900 block">{item.product.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{item.product.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{item.product.categoryName}</td>
                    <td className="p-3.5 text-right">
                      <span className="font-bold text-sm text-slate-900">
                        {item.available} {item.product.uom}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-semibold text-amber-700">
                      {item.reserved > 0 ? `${item.reserved} ${item.product.uom}` : '-'}
                    </td>
                    <td className="p-3.5 text-right text-slate-600">
                      {item.dispatched} {item.product.uom}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {formatIndianCurrency(item.valuation)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        In Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Batches and Expiry */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Batch Number</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Mfg Date</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5 text-right">Batch Qty</th>
                  <th className="p-3.5 text-center">FEFO Expiry Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{b.batchNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{b.product?.name}</td>
                    <td className="p-3.5 text-slate-600">
                      {b.manufacturingDate ? new Date(b.manufacturingDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {b.quantity} {b.product?.uom}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={clsx(
                        'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                        b.expiryStatus === 'EXPIRED' && 'bg-red-100 text-red-800 border border-red-300',
                        b.expiryStatus === 'EXPIRING_CRITICAL' && 'bg-amber-100 text-amber-900 border border-amber-300',
                        b.expiryStatus === 'EXPIRING_SOON' && 'bg-blue-100 text-blue-800',
                        b.expiryStatus === 'VALID' && 'bg-emerald-50 text-emerald-700'
                      )}>
                        {b.expiryStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Movement Audit Trail */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Movement Type</th>
                  <th className="p-3.5 text-right">Quantity</th>
                  <th className="p-3.5">Reference & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{m.product?.name || m.productId}</td>
                    <td className="p-3.5">
                      <span className={clsx(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        m.movementType.includes('ADD') || m.movementType.includes('RECEIPT') ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      )}>
                        {m.movementType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{m.quantity}</td>
                    <td className="p-3.5 text-slate-600">
                      {m.referenceId && <span className="font-mono font-semibold text-slate-800 mr-2">{m.referenceId}</span>}
                      <span>{m.notes || ''}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Adjust Inventory Stock</h2>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product *</label>
                <select
                  required
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">-- Choose Product --</option>
                  {inventory.map((i) => (
                    <option key={i.product.id} value={i.product.id}>
                      {i.product.name} ({i.available} {i.product.uom} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Action Type</label>
                  <select
                    value={adjustForm.adjustmentType}
                    onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold"
                  >
                    <option value="ADD">+ Add Stock</option>
                    <option value="REDUCE">- Deduct Stock</option>
                    <option value="DAMAGE">Mark Damaged</option>
                    <option value="RETURN">Return Inward</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  placeholder="e.g. Physical inventory variance reconciliation..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Receive New Stock</h2>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product *</label>
                <select
                  required
                  value={batchForm.productId}
                  onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                >
                  <option value="">-- Select Product --</option>
                  {inventory.map((i) => (
                    <option key={i.product.id} value={i.product.id}>
                      {i.product.name} ({i.product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mfg Date</label>
                  <input
                    type="date"
                    value={batchForm.manufacturingDate}
                    onChange={(e) => setBatchForm({ ...batchForm, manufacturingDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Received Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={batchForm.purchasePrice}
                    onChange={(e) => setBatchForm({ ...batchForm, purchasePrice: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Receive Stock Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  Tag,
  PlusCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  Layers,
  HelpCircle,
} from 'lucide-react';
import clsx from 'clsx';

export default function PricingPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [priceCategories, setPriceCategories] = useState<any[]>([]);
  const [priceMatrix, setPriceMatrix] = useState<Record<string, Record<string, number>>>({}); // { [productId]: { [priceCategoryId]: price } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Price Category modal
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pricing/matrix');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setPriceCategories(data.priceCategories || []);

        const matrix: Record<string, Record<string, number>> = {};
        (data.products || []).forEach((p: any) => {
          matrix[p.id] = {};
          (p.prices || []).forEach((pr: any) => {
            matrix[p.id][pr.priceCategoryId] = pr.price;
          });
        });
        setPriceMatrix(matrix);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (productId: string, priceCategoryId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setPriceMatrix((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [priceCategoryId]: num,
      },
    }));
  };

  const handleSaveMatrix = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);

      const updates: Array<{ productId: string; priceCategoryId: string; price: number }> = [];
      Object.entries(priceMatrix).forEach(([productId, cats]) => {
        Object.entries(cats).forEach(([priceCategoryId, price]) => {
          updates.push({ productId, priceCategoryId, price });
        });
      });

      const res = await fetch('/api/pricing/matrix', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('Failed to save pricing matrix');
      }
    } catch {
      alert('Error saving pricing matrix');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pricing/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName,
          code: newCatCode || newCatName.toUpperCase(),
          description: newCatDesc,
        }),
      });

      if (res.ok) {
        setShowAddCat(false);
        setNewCatName('');
        setNewCatCode('');
        setNewCatDesc('');
        fetchMatrix();
      }
    } catch {
      alert('Failed to create category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Price Categories & Matrix</h1>
          <p className="text-xs text-slate-500">Configure tier rates applied during order booking</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowAddCat(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
          )}
          {user?.role === 'ADMIN' && (
            <button
              onClick={handleSaveMatrix}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Matrix'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Pricing Rule Note Card */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Important B2B Pricing Rule:</strong>
          <span>
            Selling price is determined exclusively by <strong>Product + Price Category</strong> (e.g. Rice + Bulk = ₹48/kg, Rice + Loose = ₹52/kg).
            The field sales rep selects the Price Category for each order independently of the customer.
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Pricing matrix updated successfully! Changes will reflect immediately on all new orders.</span>
        </div>
      )}

      {/* Active Price Categories Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Categories ({priceCategories.length}):
        </span>
        {priceCategories.map((cat) => (
          <div
            key={cat.id}
            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shrink-0 shadow-2xs"
          >
            {cat.name}
            {cat.description && <span className="text-[10px] text-slate-400 font-normal ml-1">({cat.description})</span>}
          </div>
        ))}
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading pricing matrix...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 min-w-48">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">UOM</th>
                  <th className="p-3.5 text-right">MRP</th>
                  <th className="p-3.5 text-right">Purchase Price</th>
                  {priceCategories.map((cat) => (
                    <th key={cat.id} className="p-3.5 text-right min-w-32 bg-slate-800">
                      {cat.name} (₹)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{p.category?.name}</td>
                    <td className="p-3.5 font-bold uppercase text-slate-500 text-[11px]">{p.uom}</td>
                    <td className="p-3.5 text-right text-slate-500 font-medium">
                      {formatIndianCurrency(p.mrp)}
                    </td>
                    <td className="p-3.5 text-right text-slate-500 font-medium">
                      {formatIndianCurrency(p.purchasePrice)}
                    </td>
                    {priceCategories.map((cat) => {
                      const currentVal = priceMatrix[p.id]?.[cat.id] ?? p.mrp;

                      return (
                        <td key={cat.id} className="p-2 text-right bg-slate-50/50">
                          {user?.role === 'ADMIN' ? (
                            <input
                              type="number"
                              step="0.1"
                              value={currentVal}
                              onChange={(e) => handlePriceChange(p.id, cat.id, e.target.value)}
                              className="w-24 text-right border border-slate-300 rounded-md px-2 py-1 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                            />
                          ) : (
                            <span className="font-bold text-slate-900">{formatIndianCurrency(currentVal)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Price Category Modal */}
      {showAddCat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4">Create Price Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Institutional / Festival Special"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code (Optional)</label>
                <input
                  type="text"
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                  placeholder="e.g. INST"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Contracted institutional rates"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  Package,
  Search,
  PlusCircle,
  Tag,
  Boxes,
  AlertTriangle,
  Layers,
  CheckCircle2,
  X,
} from 'lucide-react';
import clsx from 'clsx';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [priceCategories, setPriceCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New product state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    brand: '',
    categoryId: '',
    uom: 'KG',
    packSize: '',
    hsnCode: '',
    gstRate: 5.0,
    mrp: 0,
    purchasePrice: 0,
    minStockLevel: 10,
  });

  useEffect(() => {
    fetchData();
  }, [searchQuery, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const catRes = await fetch('/api/products/categories');
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }

      const pcatRes = await fetch('/api/pricing/categories');
      if (pcatRes.ok) {
        const d = await pcatRes.json();
        setPriceCategories(d.priceCategories || []);
      }

      let url = `/api/products?q=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory !== 'ALL') {
        url += `&categoryId=${selectedCategory}`;
      }

      const prodRes = await fetch(url);
      if (prodRes.ok) {
        const d = await prodRes.json();
        setProducts(d.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
        setFormData({
          name: '',
          sku: '',
          barcode: '',
          brand: '',
          categoryId: '',
          uom: 'KG',
          packSize: '',
          hsnCode: '',
          gstRate: 5.0,
          mrp: 0,
          purchasePrice: 0,
          minStockLevel: 10,
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create product');
      }
    } catch {
      alert('Error creating product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Product Master</h1>
          <p className="text-xs text-slate-500">Manage FMCG grocery inventory, HSN codes, GST slabs & packaging</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Price Matrix</span>
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => {
                if (categories.length > 0) {
                  setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
                }
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Product Name, SKU, Barcode, Brand, or HSN Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 focus:outline-hidden bg-transparent"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden w-full sm:w-auto"
        >
          <option value="ALL">All Categories ({categories.length})</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No products found matching your search</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Product / Brand</th>
                  <th className="p-3.5">Category & UOM</th>
                  <th className="p-3.5">HSN & GST %</th>
                  <th className="p-3.5 text-right">MRP</th>
                  <th className="p-3.5 text-right">Bulk Price</th>
                  <th className="p-3.5 text-right">Loose Price</th>
                  <th className="p-3.5 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const bulkRate = p.priceMap?.['Bulk'] || p.priceMap?.['BULK'] || '-';
                  const looseRate = p.priceMap?.['Loose'] || p.priceMap?.['LOOSE'] || '-';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{p.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{p.sku}</span>
                          {p.brand && <span className="text-[11px] text-slate-500">{p.brand}</span>}
                          {p.packSize && <span className="text-[10px] text-slate-400">({p.packSize})</span>}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-700 font-medium">{p.category?.name}</span>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">{p.uom}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-slate-800 font-semibold">{p.hsnCode}</span>
                        <span className={clsx(
                          'block text-[10px] font-bold mt-0.5',
                          p.gstRate === 0 ? 'text-slate-500' : 'text-emerald-700'
                        )}>
                          GST {p.gstRate}%
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-700">
                        {formatIndianCurrency(p.mrp)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {typeof bulkRate === 'number' ? formatIndianCurrency(bulkRate) : bulkRate}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-700">
                        {typeof looseRate === 'number' ? formatIndianCurrency(looseRate) : looseRate}
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="inline-block font-bold text-slate-900 text-xs">
                          {p.totalStock} {p.uom}
                        </span>
                        {p.totalReserved > 0 && (
                          <span className="block text-[10px] text-amber-600 font-medium">({p.totalReserved} reserved)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add New FMCG Product</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="e.g. Sona Masoori Rice (25kg)"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="e.g. Kaveri Pure"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="RICE-SON-05"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="890100100099"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measurement (UOM)</label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="KG">KG (Kilogram)</option>
                    <option value="BAG">BAG</option>
                    <option value="CARTON">CARTON</option>
                    <option value="BOX">BOX</option>
                    <option value="LITRE">LITRE</option>
                    <option value="PACKET">PACKET</option>
                    <option value="PIECE">PIECE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pack Size Description</label>
                  <input
                    type="text"
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="e.g. 25 kg Bag / 15x1L"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSN Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="10063010"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Grocery)</option>
                    <option value={12}>12% (Processed)</option>
                    <option value={18}>18% (FMCG)</option>
                    <option value={28}>28% (Luxury)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

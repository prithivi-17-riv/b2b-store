'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency, calculateOrderTaxes } from '@/lib/gst';
import {
  ShoppingCart,
  Users,
  Tag,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Save,
  Send,
  Building,
  RotateCcw,
  Info,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';

interface OrderLineItem {
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  packSize?: string;
  hsnCode: string;
  gstRate: number;
  availableStock: number;
  quantity: number;
  unitRate: number;
  discountPercent: number;
}

import { Suspense } from 'react';

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Order Desk...</div>}>
      <CreateOrderContent />
    </Suspense>
  );
}

function CreateOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustId = searchParams.get('customerId');
  const { user, isOnline } = useAuth();

  const [customers, setCustomers] = useState<any[]>([]);
  const [priceCategories, setPriceCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Order State
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustId || '');
  const [selectedPriceCatId, setSelectedPriceCatId] = useState('');
  const [orderItems, setOrderItems] = useState<OrderLineItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  // Search filter for products catalog picker
  const [productSearch, setProductSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [custRes, pcatRes, prodRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/pricing/categories'),
        fetch('/api/products'),
      ]);

      const custData = await custRes.json();
      const pcatData = await pcatRes.json();
      const prodData = await prodRes.json();

      setCustomers(custData.customers || []);
      setPriceCategories(pcatData.priceCategories || []);
      setProducts(prodData.products || []);

      // Defaults
      if (pcatData.priceCategories?.length > 0) {
        const bulkCat = pcatData.priceCategories.find((c: any) => c.name === 'Bulk' || c.code === 'BULK');
        setSelectedPriceCatId(bulkCat ? bulkCat.id : pcatData.priceCategories[0].id);
      }

      if (initialCustId && custData.customers?.length > 0) {
        setSelectedCustomerId(initialCustId);
      }
    } catch (err) {
      console.error('Failed to load order form data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const selectedPriceCategory = useMemo(() => {
    return priceCategories.find((p) => p.id === selectedPriceCatId) || null;
  }, [priceCategories, selectedPriceCatId]);

  // When Price Category changes, dynamically update the rates of all existing line items
  useEffect(() => {
    if (!selectedPriceCatId || products.length === 0) return;

    setOrderItems((prevItems) =>
      prevItems.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return item;

        const newRate = prod.priceMap?.[selectedPriceCatId] ?? prod.mrp;
        return {
          ...item,
          unitRate: newRate,
        };
      })
    );
  }, [selectedPriceCatId, products]);

  // Tax and Grand Total Calculations
  const calculations = useMemo(() => {
    const sellerStateCode = '33'; // Tamil Nadu
    const buyerStateCode = selectedCustomer?.stateCode || '33';

    const inputs = orderItems.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      hsnCode: it.hsnCode,
      uom: it.uom,
      quantity: it.quantity,
      unitRate: it.unitRate,
      discountPercent: it.discountPercent,
      gstRate: it.gstRate,
    }));

    return calculateOrderTaxes(inputs, sellerStateCode, buyerStateCode, orderDiscount);
  }, [orderItems, selectedCustomer, orderDiscount]);


  // Add or increment item
  const handleAddProduct = (prod: any) => {
    const rate = prod.priceMap?.[selectedPriceCatId] ?? prod.mrp;

    setOrderItems((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === prod.id ? { ...i, quantity: i.quantity + 1, unitRate: rate } : i
        );
      } else {
        return [
          ...prev,
          {
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            uom: prod.uom,
            packSize: prod.packSize,
            hsnCode: prod.hsnCode,
            gstRate: prod.gstRate,
            availableStock: prod.totalStock,
            quantity: 1,
            unitRate: rate,
            discountPercent: 0,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setOrderItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  };

  const handleUpdateDiscount = (productId: string, discount: number) => {
    setOrderItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, discountPercent: discount } : i))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Submit Order to Server or Local Draft
  const handleSubmitOrder = async (isDraft: boolean = false) => {
    if (!selectedCustomerId) {
      alert('Please select a customer first');
      return;
    }
    if (orderItems.length === 0) {
      alert('Please add at least one product to the order');
      return;
    }

    const payload = {
      customerId: selectedCustomerId,
      priceCategoryId: selectedPriceCatId,
      items: orderItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        discountPercent: i.discountPercent,
      })),
      orderDiscountAmount: orderDiscount,
      isDraft,
      notes,
    };

    if (!isOnline) {
      // Save in LocalStorage
      const drafts = JSON.parse(localStorage.getItem('b2b_offline_drafts') || '[]');
      drafts.push({
        ...payload,
        id: `offline-${Date.now()}`,
        customerName: selectedCustomer?.storeName,
        grandTotal: calculations.grandTotal,
        date: new Date().toISOString(),
      });
      localStorage.setItem('b2b_offline_drafts', JSON.stringify(drafts));
      alert('Order saved offline locally! It will sync automatically when you reconnect.');
      router.push('/orders');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/orders/${data.order.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit order');
      }
    } catch {
      alert('Error submitting order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesCat = selectedCatFilter === 'ALL' || p.categoryId === selectedCatFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, selectedCatFilter]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading Order Booking Desk...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Book Bulk Grocery Order</h1>
          <p className="text-xs text-slate-500">Fast field-sales order entry with automated GST calculations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmitOrder(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSubmitOrder(false)}
            disabled={submitting || orderItems.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Order'}</span>
          </button>
        </div>
      </div>

      {/* Step 1 & 2: Customer & Price Category Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer Selector */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Select Customer / Supermarket
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="">-- Choose Customer Store --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.storeName} ({c.city})
              </option>
            ))}
          </select>

          {/* Selected Customer Quick Snapshot Card */}
          {selectedCustomer && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{selectedCustomer.storeName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  GSTIN: <span className="font-mono font-bold text-slate-800">{selectedCustomer.gstin || 'Unregistered'}</span> • {selectedCustomer.city} ({selectedCustomer.state})
                </p>
                <p className="text-[11px] text-slate-500">
                  Payment Terms: <span className="font-semibold text-slate-700">{selectedCustomer.paymentTermsDays} Days</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Price Category Selector */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>2. Price Category</span>
            <span className="text-[10px] text-emerald-600 font-bold">Auto-Prices</span>
          </label>
          <select
            value={selectedPriceCatId}
            onChange={(e) => setSelectedPriceCatId(e.target.value)}
            className="w-full bg-emerald-50/70 border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            {priceCategories.map((pcat) => (
              <option key={pcat.id} value={pcat.id}>
                {pcat.name} Tier {pcat.description ? `(${pcat.description})` : ''}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-2">
            Selected Tier: <strong>{selectedPriceCategory?.name}</strong>. Rates for all added products will automatically align to this price category.
          </p>
        </div>
      </div>

      {/* Main Order Workspace: Line Items & Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (7 Cols): Active Order Items Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Order Items ({orderItems.length})</h2>
                <p className="text-[11px] text-slate-500">Live line items with GST breakdown</p>
              </div>
              {orderItems.length > 0 && (
                <button
                  onClick={() => setOrderItems([])}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {orderItems.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>No products added to this order yet. Select items from the catalog on the right.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orderItems.map((item) => {
                  const lineRaw = item.quantity * item.unitRate;
                  const lineDisc = (lineRaw * item.discountPercent) / 100;
                  const lineTaxable = lineRaw - lineDisc;
                  const lineGst = (lineTaxable * item.gstRate) / 100;
                  const lineTotal = lineTaxable + lineGst;

                  return (
                    <div key={item.productId} className="p-3.5 hover:bg-slate-50/50 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.productName}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono">{item.sku}</span>
                            <span>•</span>
                            <span>HSN: {item.hsnCode}</span>
                            <span>•</span>
                            <span className="font-semibold text-emerald-700">GST {item.gstRate}%</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900">{formatIndianCurrency(lineTotal)}</span>
                          <span className="block text-[10px] text-slate-400">
                            (₹{item.unitRate}/{item.uom})
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Discount Controls */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.productId, Number(e.target.value))}
                              className="w-14 text-center font-bold text-slate-900 text-xs focus:outline-hidden py-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-bold text-slate-600 text-xs">{item.uom}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500">Disc %:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountPercent}
                              onChange={(e) => handleUpdateDiscount(item.productId, Number(e.target.value))}
                              className="w-12 text-center border border-slate-300 rounded-md px-1 py-0.5 text-xs font-semibold focus:outline-hidden"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Remove Line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1">Order Notes / Delivery Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Urgent morning dispatch requested, call store manager prior to unloading..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Right Col (5 Cols): Product Catalog Quick-Add & GST Summary */}
        <div className="lg:col-span-5 space-y-4">
          {/* Product Quick-Add Catalog */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Product Catalog ({filteredProducts.length})
            </h2>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search grocery item..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-hidden text-slate-800"
              />
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredProducts.map((p) => {
                const applicableRate = p.priceMap?.[selectedPriceCatId] ?? p.mrp;
                const isAdded = orderItems.some((i) => i.productId === p.id);

                return (
                  <div key={p.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.packSize || p.uom} • Stock: <span className="font-semibold text-slate-700">{p.totalStock}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-emerald-800 text-xs">
                        {formatIndianCurrency(applicableRate)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddProduct(p)}
                        className={clsx(
                          'px-2.5 py-1 rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center gap-1',
                          isAdded
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        )}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GST Tax Calculation Summary Card */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 shadow-md space-y-3 text-xs">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              GST Calculation Summary
            </h2>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal ({calculations.totalQuantity} items):</span>
                <span>{formatIndianCurrency(calculations.subtotal)}</span>
              </div>

              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Total Discount:</span>
                  <span>-{formatIndianCurrency(calculations.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span>Taxable Value:</span>
                <span className="font-semibold text-white">{formatIndianCurrency(calculations.taxableAmount)}</span>
              </div>

              {!calculations.isInterstate ? (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>CGST:</span>
                    <span>{formatIndianCurrency(calculations.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SGST:</span>
                    <span>{formatIndianCurrency(calculations.sgstAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-blue-400 font-semibold">
                  <span>IGST (Interstate):</span>
                  <span>{formatIndianCurrency(calculations.igstAmount)}</span>
                </div>
              )}

              {calculations.roundOff !== 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Round Off:</span>
                  <span>{calculations.roundOff > 0 ? `+${calculations.roundOff}` : calculations.roundOff}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grand Total</span>
                <span className="text-xl font-black text-white">{formatIndianCurrency(calculations.grandTotal)}</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
                {calculations.isInterstate ? 'IGST Applicable' : 'CGST + SGST (TN 33)'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 italic pt-1">
              {calculations.amountInWords}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

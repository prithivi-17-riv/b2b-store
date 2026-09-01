'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { formatIndianCurrency } from '@/lib/gst';
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Building,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import clsx from 'clsx';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New Customer Form State
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    phone: '',
    altPhone: '',
    email: '',
    billingAddress: '',
    deliveryAddress: '',
    city: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    stateCode: '33',
    pincode: '641001',
    gstin: '',
    pan: '',
    customerType: 'SUPERMARKET',
    creditLimit: 200000,
    paymentTermsDays: 15,
    openingBalance: 0,
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, user]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = `/api/customers?q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCustomers();
        // Reset
        setFormData({
          storeName: '',
          ownerName: '',
          phone: '',
          altPhone: '',
          email: '',
          billingAddress: '',
          deliveryAddress: '',
          city: 'Coimbatore',
          district: 'Coimbatore',
          state: 'Tamil Nadu',
          stateCode: '33',
          pincode: '641001',
          gstin: '',
          pan: '',
          customerType: 'SUPERMARKET',
          creditLimit: 200000,
          paymentTermsDays: 15,
          openingBalance: 0,
          notes: '',
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create customer');
      }
    } catch (err) {
      alert('Error creating customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Directory</h1>
          <p className="text-xs text-slate-500">Manage retail stores, supermarkets, credit limits & GSTIN</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by Store Name, Owner, Phone, GSTIN, or City..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs text-slate-800 focus:outline-hidden bg-transparent"
        />
      </div>

      {/* Customer Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No customers found matching your criteria</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Store / Customer</th>
                  <th className="p-3.5">Contact & City</th>
                  <th className="p-3.5">GSTIN / Type</th>
                  <th className="p-3.5">Assigned Rep</th>
                  <th className="p-3.5 text-right">Credit Limit</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <Link href={`/customers/${c.id}`} className="font-bold text-slate-900 hover:text-emerald-600 block">
                          {c.storeName}
                        </Link>
                        <span className="text-[11px] text-slate-400">{c.customerCode} • {c.ownerName}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.city}, {c.state}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[11px] font-semibold text-slate-800">
                          {c.gstin || 'Unregistered'}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          {c.customerType} • {c.paymentTermsDays}d Terms
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-700 font-medium">{c.assignedEmployee?.name || 'Unassigned'}</span>
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="text-slate-900 font-bold">
                          {formatIndianCurrency(c.creditLimit)}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/customers/${c.id}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                          >
                            Ledger
                          </Link>
                          <Link
                            href={`/orders/new?customerId=${c.id}`}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-semibold text-[11px] border border-emerald-200"
                          >
                            Order
                          </Link>
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

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add New Customer</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="e.g. Sri Lakshmi Stores"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owner / Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="e.g. V. Ramasamy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="e.g. 9843012345"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="33AAACL1234F1Z1"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Type</label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="SUPERMARKET">Supermarket</option>
                    <option value="KIRANA_STORE">Kirana Store</option>
                    <option value="WHOLESALER">Wholesaler</option>
                    <option value="HOTEL_INSTITUTION">Hotel / Institution</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="Street, locality, area..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State (Code)</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

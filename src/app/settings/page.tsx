'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  Settings,
  Building2,
  Receipt,
  Save,
  CheckCircle2,
  Percent,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [taxConfigs, setTaxConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [compRes, taxRes] = await Promise.all([
        fetch('/api/settings/company'),
        fetch('/api/settings/tax'),
      ]);

      if (compRes.ok) {
        const d = await compRes.json();
        setCompany(d.company);
      }

      if (taxRes.ok) {
        const d = await taxRes.json();
        setTaxConfigs(d.taxConfigs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        alert('Failed to save settings');
      }
    } catch {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading system settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Company & GST Configuration</h1>
          <p className="text-xs text-slate-500">Manage statutory legal entity information, bank settlement info & GST tax slabs</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Company settings and GST profile updated successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      {company && (
        <form onSubmit={handleSaveCompany} className="space-y-6 text-xs">
          {/* Company Legal Profile */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Company Legal Entity Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trade Name / Brand</label>
                <input
                  type="text"
                  value={company.tradeName || ''}
                  onChange={(e) => setCompany({ ...company, tradeName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN *</label>
                <input
                  type="text"
                  required
                  value={company.gstin}
                  onChange={(e) => setCompany({ ...company, gstin: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN *</label>
                <input
                  type="text"
                  required
                  value={company.pan}
                  onChange={(e) => setCompany({ ...company, pan: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State & State Code *</label>
                <input
                  type="text"
                  required
                  value={`${company.state} (${company.stateCode})`}
                  onChange={(e) => setCompany({ ...company, state: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered Godown / Office Address *</label>
              <textarea
                rows={2}
                required
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={company.city}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={company.pincode}
                  onChange={(e) => setCompany({ ...company, pincode: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Bank Settlement Details (Printed on Invoices)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={company.bankName}
                  onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={company.bankAccountNumber}
                  onChange={(e) => setCompany({ ...company, bankAccountNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={company.bankIfsc}
                  onChange={(e) => setCompany({ ...company, bankIfsc: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={company.bankBranch}
                  onChange={(e) => setCompany({ ...company, bankBranch: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Standard B2B Invoice Terms & Conditions
            </h2>
            <textarea
              rows={3}
              value={company.termsAndConditions}
              onChange={(e) => setCompany({ ...company, termsAndConditions: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* GST Slabs Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Percent className="w-4 h-4 text-emerald-600" />
              <span>Configured GST Tax Slabs (India)</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Slab Name</th>
                    <th className="p-2.5 text-center">CGST Rate</th>
                    <th className="p-2.5 text-center">SGST Rate</th>
                    <th className="p-2.5 text-center">IGST Rate</th>
                    <th className="p-2.5 text-center">Cess Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxConfigs.map((t) => (
                    <tr key={t.id}>
                      <td className="p-2.5 font-bold text-slate-900">{t.name}</td>
                      <td className="p-2.5 text-center text-slate-700">{t.cgstRate}%</td>
                      <td className="p-2.5 text-center text-slate-700">{t.sgstRate}%</td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">{t.igstRate}%</td>
                      <td className="p-2.5 text-center text-slate-500">{t.cessRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

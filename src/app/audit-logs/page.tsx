'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  ShieldCheck,
  Search,
  Filter,
  User,
  Clock,
  FileCode,
} from 'lucide-react';
import clsx from 'clsx';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = '/api/audit-logs';
      if (actionFilter !== 'ALL') {
        url += `?action=${actionFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Audit Trail</h1>
          <p className="text-xs text-slate-500">Immutable record of critical pricing, order approvals, inventory changes & user actions</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No audit logs recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User & Role</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity Type</th>
                  <th className="p-3.5">Entity ID</th>
                  <th className="p-3.5">Change Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">{log.userName || 'System'}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{log.userRole || 'SYSTEM'}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{log.entityType}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{log.entityId || '-'}</td>
                    <td className="p-3.5 max-w-xs truncate font-mono text-[10px] text-slate-600">
                      {log.newValuesJson || log.oldValuesJson || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

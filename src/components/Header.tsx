'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, DEMO_ACCOUNTS } from '@/lib/context/AuthContext';
import {
  Menu,
  Bell,
  Wifi,
  WifiOff,
  UserCheck,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, loginAs, isOnline } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [offlineDraftCount, setOfflineDraftCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    checkOfflineDrafts();
    const interval = setInterval(() => {
      fetchNotifications();
      checkOfflineDrafts();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  const checkOfflineDrafts = () => {
    if (typeof window !== 'undefined') {
      const drafts = localStorage.getItem('b2b_offline_drafts');
      if (drafts) {
        try {
          const parsed = JSON.parse(drafts);
          setOfflineDraftCount(parsed.length);
        } catch {
          setOfflineDraftCount(0);
        }
      } else {
        setOfflineDraftCount(0);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-800">Annapoorna B2B Wholesale</span>
          <span>•</span>
          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium border border-emerald-200">
            GST Active (TN 33)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Online / Offline Status Badge */}
        <div
          className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
          )}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-600" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Offline draft badge if present */}
        {offlineDraftCount > 0 && (
          <Link
            href="/orders/new"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold hover:bg-amber-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{offlineDraftCount} Drafts Synced</span>
          </Link>
        )}

        {/* Create Order Quick Action */}
        {(user?.role === 'ADMIN' || user?.role === 'SALES_EMPLOYEE') && (
          <Link
            href="/orders/new"
            className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Order</span>
          </Link>
        )}

        {/* Role Switcher Demo Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200"
            title="Switch User Role for Testing"
          >
            <UserCheck className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline font-semibold">{user?.name?.split(' ')[0] || 'Role'}:</span>
            <span className="text-slate-900 font-bold">{user?.role?.replace('_', ' ')}</span>
          </button>

          {showRoleSelector && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role Perspective (Demo)
              </div>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => {
                    loginAs(acc.email);
                    setShowRoleSelector(false);
                  }}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors',
                    user?.email === acc.email ? 'bg-emerald-50/70 font-semibold text-emerald-900' : 'text-slate-700'
                  )}
                >
                  <div>
                    <p className="font-bold">{acc.name}</p>
                    <p className="text-[11px] text-slate-500">{acc.label}</p>
                  </div>
                  {user?.email === acc.email && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">System Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={clsx('p-3 text-xs hover:bg-slate-50', !n.isRead && 'bg-blue-50/50')}
                    >
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <p className="text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

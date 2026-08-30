'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES_EMPLOYEE' | 'WAREHOUSE_STAFF' | 'DELIVERY_STAFF';
  phone?: string;
  employeeCode?: string;
  territory?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  loginAs: (email: string) => Promise<boolean>;
  logout: () => void;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginAs: async () => false,
  logout: () => {},
  isOnline: true,
});

export const DEMO_ACCOUNTS = [
  { name: 'Rajesh Sharma', email: 'admin@annapoorna.com', role: 'ADMIN' as const, label: 'Admin (Full Access)' },
  { name: 'Arun Kumar', email: 'arun@annapoorna.com', role: 'SALES_EMPLOYEE' as const, label: 'Sales Officer (Field Orders)' },
  { name: 'Muthu Pandi', email: 'muthu@annapoorna.com', role: 'WAREHOUSE_STAFF' as const, label: 'Warehouse Staff (Inventory/Batches)' },
  { name: 'Selvam K', email: 'selvam@annapoorna.com', role: 'DELIVERY_STAFF' as const, label: 'Delivery Staff (Dispatch/POD)' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Load saved user session or default to Admin for easy demonstration
      const savedUser = localStorage.getItem('b2b_user_session');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setDefaultAdmin();
        }
      } else {
        setDefaultAdmin();
      }
      setLoading(false);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const setDefaultAdmin = () => {
    const adminUser: UserSession = {
      id: 'demo-admin',
      name: 'Rajesh Sharma',
      email: 'admin@annapoorna.com',
      role: 'ADMIN',
    };
    setUser(adminUser);
    localStorage.setItem('b2b_user_session', JSON.stringify(adminUser));
  };

  const loginAs = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: email.includes('admin') ? 'admin123' : email.includes('sales') || email.includes('arun') ? 'sales123' : email.includes('wh') || email.includes('muthu') ? 'wh123' : 'del123',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('b2b_user_session', JSON.stringify(data.user));
        localStorage.setItem('b2b_token', data.token);
        return true;
      } else {
        // Fallback for offline demo selection
        const fallback = DEMO_ACCOUNTS.find((a) => a.email === email);
        if (fallback) {
          const fallbackUser: UserSession = {
            id: `usr-${fallback.role.toLowerCase()}`,
            name: fallback.name,
            email: fallback.email,
            role: fallback.role,
          };
          setUser(fallbackUser);
          localStorage.setItem('b2b_user_session', JSON.stringify(fallbackUser));
          return true;
        }
      }
    } catch {
      const fallback = DEMO_ACCOUNTS.find((a) => a.email === email);
      if (fallback) {
        const fallbackUser: UserSession = {
          id: `usr-${fallback.role.toLowerCase()}`,
          name: fallback.name,
          email: fallback.email,
          role: fallback.role,
        };
        setUser(fallbackUser);
        localStorage.setItem('b2b_user_session', JSON.stringify(fallbackUser));
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('b2b_user_session');
    localStorage.removeItem('b2b_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAs, logout, isOnline }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

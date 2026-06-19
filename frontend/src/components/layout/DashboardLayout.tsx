'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Bell, HelpCircle, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load old notifications from localStorage
    const saved = localStorage.getItem('leadforge_notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {}
    } else {
      // Create some default welcome notifications
      const defaults = [
        { id: 1, title: 'Welcome to LeadForge AI', time: 'Just now', read: false },
        { id: 2, title: 'You have 50 free leads available', time: '1 hr ago', read: false }
      ];
      setNotifications(defaults);
      localStorage.setItem('leadforge_notifications', JSON.stringify(defaults));
    }

    // Click outside handler
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('leadforge_notifications', JSON.stringify(updated));
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem('leadforge_notifications', JSON.stringify([]));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 glass border-b border-white/5 relative z-40">
          <div>
            {title && <h1 className="text-lg font-semibold text-white">{title}</h1>}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <Link 
              href="/docs"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
              title="Documentation"
            >
              <HelpCircle size={16} />
            </Link>
            
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative ${showNotifications ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                title="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
                )}
              </button>

              {/* Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 card-dark shadow-2xl border border-white/10 rounded-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-semibold text-white text-sm">Notifications</h3>
                    <div className="flex gap-2">
                      <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-white" title="Mark all as read">
                        <Check size={14} />
                      </button>
                      <button onClick={clearNotifications} className="text-xs text-slate-400 hover:text-danger-400" title="Clear all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {notifications.map((notif, idx) => (
                          <div key={idx} className={`p-4 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-brand-500/5' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-slate-300'}`}>
                                {notif.title}
                              </p>
                              {!notif.read && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}

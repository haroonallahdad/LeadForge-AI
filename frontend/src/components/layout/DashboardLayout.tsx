'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Bell, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 glass border-b border-white/5">
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
            <button 
              onClick={() => toast('No new notifications', { icon: '🔔' })}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white relative"
              title="Notifications"
            >
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
            </button>
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';
import {
  LayoutDashboard, Search, Users, Briefcase, Download,
  BarChart3, Building2, Settings, LogOut, Zap, ChevronRight,
  Shield
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/exports', icon: Download, label: 'Exports' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/industries', icon: Building2, label: 'Industries' },
  { href: '/upgrade', icon: Shield, label: 'Upgrade Plan' },
  { href: '/admin', icon: Users, label: 'Admin Panel' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col glass border-r border-white/5 z-30">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', boxShadow: '0 0 15px rgba(99,102,241,0.4)' }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">LeadForge</span>
            <span className="gradient-text font-bold text-sm"> AI</span>
            <p className="text-xs text-slate-500 -mt-0.5">by Tech Harbor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 pt-2 pb-1">
          Main
        </p>
        {NAV_ITEMS.slice(0, 4).map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-item ${pathname === href || pathname.startsWith(href + '/') ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
            {(pathname === href || pathname.startsWith(href + '/')) && (
              <ChevronRight size={14} className="ml-auto opacity-50" />
            )}
          </Link>
        ))}

        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 pt-4 pb-1">
          Insights
        </p>
        {NAV_ITEMS.slice(4).map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-item ${pathname === href ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
            {pathname === href && (
              <ChevronRight size={14} className="ml-auto opacity-50" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-white/5 space-y-1">
        {/* Tech Harbor badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 mb-2">
          <Shield size={14} className="text-brand-400" />
          <span className="text-xs text-slate-400">Ethical · Compliant · Secure</span>
        </div>

        <button
          onClick={authApi.logout}
          className="sidebar-item w-full text-red-400 hover:text-red-300"
          style={{ color: undefined }}
        >
          <LogOut size={17} className="text-red-400" />
          <span className="text-red-400">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrendingUp, Users, Target, Trophy, Download, Briefcase, ArrowUpRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f87171', '#a78bfa', '#34d399', '#fb923c'];

function StatCard({
  label, value, icon: Icon, trend, color = 'brand'
}: {
  label: string; value: string | number; icon: any; trend?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'from-brand-600/20 to-brand-500/5 border-brand-500/20',
    cyan: 'from-accent-500/20 to-accent-500/5 border-accent-500/20',
    green: 'from-success-500/20 to-success-500/5 border-success-500/20',
    amber: 'from-warning-500/20 to-warning-500/5 border-warning-500/20',
    red: 'from-danger-500/20 to-danger-500/5 border-danger-500/20',
  };
  const iconColorMap: Record<string, string> = {
    brand: 'text-brand-400', cyan: 'text-accent-400', green: 'text-success-400',
    amber: 'text-warning-400', red: 'text-danger-400',
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${colorMap[color]} border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-success-400 flex items-center gap-1 mt-1">
              <ArrowUpRight size={12} /> {trend}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl bg-white/5 ${iconColorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl p-3 text-xs border border-white/10">
        <p className="text-white font-medium">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.get,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Overview of your lead intelligence">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const a = analytics;

  return (
    <DashboardLayout title="Dashboard" subtitle="Your lead intelligence overview">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Leads" value={a?.total_leads ?? 0} icon={Users} color="brand" trend="+12% this month" />
        <StatCard label="Avg Lead Score" value={a?.avg_lead_score ?? 0} icon={Target} color="cyan" />
        <StatCard label="Contacted" value={a?.contacted_leads ?? 0} icon={TrendingUp} color="green" />
        <StatCard label="Closed Won" value={a?.closed_won ?? 0} icon={Trophy} color="amber" />
        <StatCard label="Exports" value={a?.total_exports ?? 0} icon={Download} color="red" />
        <StatCard label="Search Jobs" value={a?.total_jobs ?? 0} icon={Briefcase} color="brand" />
      </div>

      {/* Conversion KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card-dark">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Contact Rate</p>
            <span className="text-xs text-slate-400">{a?.contact_rate ?? 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(a?.contact_rate ?? 0, 100)}%` }} />
          </div>
        </div>
        <div className="card-dark">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Conversion Rate</p>
            <span className="text-xs text-slate-400">{a?.conversion_rate ?? 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(a?.conversion_rate ?? 0, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Industries */}
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white mb-4">Top Industries</h3>
          {a?.top_industries?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.top_industries.slice(0, 8)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                  {a.top_industries.slice(0, 8).map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state h-52 text-slate-500 text-sm">No data yet — start a search</div>
          )}
        </div>

        {/* Top Locations */}
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white mb-4">Top Locations</h3>
          {a?.top_cities?.length ? (
            <div className="space-y-3">
              {a.top_cities.slice(0, 8).map((city: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-4 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">{city.name || 'Unknown'}</span>
                      <span className="text-slate-400">{city.count}</span>
                    </div>
                    <div className="progress-bar h-1.5">
                      <div
                        className="progress-fill h-full"
                        style={{
                          width: `${(city.count / (a.top_cities[0]?.count || 1)) * 100}%`,
                          background: COLORS[i % COLORS.length],
                          boxShadow: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state h-52 text-slate-500 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-dark">
        <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Search', href: '/search', color: 'bg-brand-600/20 border-brand-500/30 text-brand-300' },
            { label: 'View Leads', href: '/leads', color: 'bg-accent-500/20 border-accent-500/30 text-accent-300' },
            { label: 'Export Leads', href: '/exports', color: 'bg-success-500/20 border-success-500/30 text-success-400' },
            { label: 'Analytics', href: '/analytics', color: 'bg-warning-500/20 border-warning-500/30 text-warning-400' },
          ].map(({ label, href, color }) => (
            <a
              key={href}
              href={href}
              className={`${color} border rounded-xl p-4 text-center text-sm font-medium transition-all hover:opacity-80`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f87171', '#a78bfa', '#34d399', '#fb923c'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl p-3 text-xs border border-white/10">
        <p className="text-white font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.get,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  const a = data;

  return (
    <DashboardLayout title="Analytics" subtitle="Platform performance and lead insights">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: a?.total_leads ?? 0, suffix: '', color: 'text-brand-400' },
          { label: 'Avg Lead Score', value: a?.avg_lead_score ?? 0, suffix: '', color: 'text-cyan-400' },
          { label: 'Contact Rate', value: a?.contact_rate ?? 0, suffix: '%', color: 'text-green-400' },
          { label: 'Conversion Rate', value: a?.conversion_rate ?? 0, suffix: '%', color: 'text-amber-400' },
          { label: 'Contacted Leads', value: a?.contacted_leads ?? 0, suffix: '', color: 'text-purple-400' },
          { label: 'Closed Won', value: a?.closed_won ?? 0, suffix: '', color: 'text-emerald-400' },
          { label: 'Total Exports', value: a?.total_exports ?? 0, suffix: '', color: 'text-red-400' },
          { label: 'Search Jobs', value: a?.total_jobs ?? 0, suffix: '', color: 'text-slate-400' },
        ].map(({ label, value, suffix, color }) => (
          <div key={label} className="stat-card">
            <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}{suffix}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Industries Bar Chart */}
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white mb-4">Leads by Industry</h3>
          {a?.top_industries?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={a.top_industries} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                  {a.top_industries.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state h-64 text-slate-500 text-sm">No industry data yet</div>
          )}
        </div>

        {/* Cities Pie Chart */}
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white mb-4">Leads by City</h3>
          {a?.top_cities?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={a.top_cities.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  dataKey="count"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {a.top_cities.slice(0, 8).map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state h-64 text-slate-500 text-sm">No location data yet</div>
          )}
        </div>
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white mb-4">Top Industries</h3>
          <div className="space-y-2.5">
            {a?.top_industries?.slice(0, 8).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{item.name}</span>
                    <span className="text-slate-400">{item.count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.count / (a.top_industries[0]?.count || 1)) * 100}%`,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {!a?.top_industries?.length && <p className="text-xs text-slate-600">No data yet</p>}
          </div>
        </div>

        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white mb-4">Top Cities</h3>
          <div className="space-y-2.5">
            {a?.top_cities?.slice(0, 8).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{item.name || 'Unknown'}</span>
                    <span className="text-slate-400">{item.count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.count / (a.top_cities[0]?.count || 1)) * 100}%`,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {!a?.top_cities?.length && <p className="text-xs text-slate-600">No data yet</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { industriesApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Building2, Plus, Search, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IndustriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const { data: industries, isLoading } = useQuery({
    queryKey: ['industries', search],
    queryFn: () => industriesApi.getAll(search),
  });

  const createMutation = useMutation({
    mutationFn: () => industriesApi.create(newName, newCategory || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      setNewName('');
      setNewCategory('');
      toast.success('Industry created');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const grouped = industries?.reduce((acc: Record<string, any[]>, i) => {
    const cat = i.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(i);
    return acc;
  }, {}) || {};

  return (
    <DashboardLayout title="Industries" subtitle={`${industries?.length ?? 0} industries available`}>
      {/* Add Custom Industry */}
      <div className="card-dark mb-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Plus size={14} className="text-brand-400" /> Add Custom Industry
        </h3>
        <div className="flex gap-3">
          <input
            placeholder="Industry name (e.g., Solar Panel Companies)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input-dark flex-1"
          />
          <input
            placeholder="Category (optional)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="input-dark w-44"
          />
          <button
            onClick={() => newName.trim() && createMutation.mutate()}
            disabled={!newName.trim() || createMutation.isPending}
            className="btn-primary px-5"
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Search industries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-dark pl-9"
        />
      </div>

      {/* Industry Groups */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {category} ({items.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((ind) => (
                  <span
                    key={ind.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      ind.is_custom
                        ? 'bg-brand-500/15 text-brand-300 border-brand-500/25'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {ind.is_custom && <Tag size={10} />}
                    {ind.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="empty-state">
              <Building2 size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-400">No industries found</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

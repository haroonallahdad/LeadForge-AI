'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, exportApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Search, Download, ExternalLink, Mail, Phone,
  Globe, Star, ChevronUp, ChevronDown, RefreshCw, Eye,
  Building2, MapPin
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { LeadListItem, LeadFilters, LeadStatus } from '@/types';

const STATUS_OPTIONS: LeadStatus[] = [
  'new', 'researching', 'contacted', 'follow_up', 'interested',
  'meeting_scheduled', 'proposal_sent', 'closed_won', 'closed_lost', 'rejected'
];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New', researching: 'Researching', contacted: 'Contacted',
  follow_up: 'Follow Up', interested: 'Interested', meeting_scheduled: 'Meeting',
  proposal_sent: 'Proposal Sent', closed_won: 'Closed Won', closed_lost: 'Closed Lost', rejected: 'Rejected',
};

const STATUS_CLASSES: Record<LeadStatus, string> = {
  new: 'status-new', researching: 'badge bg-purple-500/20 text-purple-300 border border-purple-500/30',
  contacted: 'status-contacted', follow_up: 'badge bg-orange-500/20 text-orange-300 border border-orange-500/30',
  interested: 'status-interested', meeting_scheduled: 'badge bg-teal-500/20 text-teal-300 border border-teal-500/30',
  proposal_sent: 'badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  closed_won: 'status-closed-won', closed_lost: 'badge bg-gray-500/20 text-gray-400 border border-gray-500/30',
  rejected: 'status-rejected',
};

function ScoreBadge({ score }: { score: number }) {
  if (score >= 150) return <span className="score-badge-high">{score}</span>;
  if (score >= 80) return <span className="score-badge-mid">{score}</span>;
  return <span className="score-badge-low">{score}</span>;
}

// ── Mobile Card ──────────────────────────────────────────────────────────────
function LeadCard({ lead, onStatusChange }: { lead: LeadListItem; onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="card-dark p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{lead.company_name}</h3>
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-accent-400 flex items-center gap-1 mt-0.5"
            >
              <Globe size={9} />
              {lead.website.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreBadge score={lead.lead_score} />
          <Link href={`/leads/${lead.id}`} className="text-brand-400 hover:text-brand-300">
            <Eye size={15} />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
        {lead.industry && (
          <span className="flex items-center gap-1">
            <Building2 size={10} /> {lead.industry}
          </span>
        )}
        {(lead.city || lead.country) && (
          <span className="flex items-center gap-1">
            <MapPin size={10} /> {[lead.city, lead.state].filter(Boolean).join(', ') || lead.country}
          </span>
        )}
        {lead.rating != null && (
          <span className="flex items-center gap-1">
            <Star size={10} className="text-yellow-400 fill-yellow-400" /> {lead.rating}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
          className={`text-xs rounded-lg px-2 py-1 bg-transparent border border-white/10 cursor-pointer flex-1 ${STATUS_CLASSES[lead.status]}`}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s} className="bg-slate-900 text-white">{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <div className="flex gap-2">
          {lead.emails[0] && (
            <a href={`mailto:${lead.emails[0]}`} className="text-slate-400 hover:text-white">
              <Mail size={14} />
            </a>
          )}
          {lead.phones[0] && (
            <a href={`tel:${lead.phones[0]}`} className="text-slate-400 hover:text-white">
              <Phone size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeadFilters>({ sort_by: 'lead_score', sort_dir: 'desc' });
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const limit = 50;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads', filters, page],
    queryFn: () => leadsApi.getLeads({ ...filters, skip: page * limit, limit }),
    staleTime: 10000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leadsApi.updateLead(id, { status: status as LeadStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Status updated');
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => exportApi.export('csv', selectedIds.length ? selectedIds : undefined),
    onSuccess: () => toast.success('Export started!'),
    onError: () => toast.error('Export failed'),
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === data?.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data?.items.map(l => l.id) || []);
    }
  };

  return (
    <DashboardLayout
      title="Leads"
      subtitle={`${data?.total ?? 0} leads found`}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <Download size={13} />
            <span className="hidden sm:inline">{selectedIds.length ? `Export (${selectedIds.length})` : 'Export'}</span>
          </button>
          <Link href="/search" className="btn-primary text-xs py-1.5 px-3">
            <Search size={13} /> <span className="hidden sm:inline">New Search</span>
          </Link>
        </div>
      }
    >
      {/* Filters Bar */}
      <div className="glass rounded-xl p-3 mb-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search companies..."
            value={filters.search || ''}
            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(0); }}
            className="input-dark pl-8 py-1.5 text-sm w-full"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:contents">
          <select
            value={filters.status || ''}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(0); }}
            className="input-dark py-1.5 text-sm"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          <input
            placeholder="Industry..."
            value={filters.industry || ''}
            onChange={(e) => { setFilters({ ...filters, industry: e.target.value }); setPage(0); }}
            className="input-dark py-1.5 text-sm"
          />

          <button onClick={() => refetch()} className="btn-secondary py-1.5 px-3 text-xs flex items-center justify-center gap-1">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/25">
          <span className="text-sm text-brand-300">{selectedIds.length} selected</span>
          <button onClick={() => exportMutation.mutate()} className="btn-primary text-xs py-1 px-3">
            <Download size={12} /> Export
          </button>
          <button onClick={() => setSelectedIds([])} className="text-xs text-slate-400 hover:text-white">Clear</button>
        </div>
      )}

      {/* ── Mobile: Card Layout ─────────────────────────────── */}
      <div className="block md:hidden space-y-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-xl" />
            ))
          : data?.items.map((lead: LeadListItem) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
              />
            ))
        }
        {!isLoading && !data?.items.length && (
          <div className="empty-state py-12">
            <Building2 size={36} className="text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium">No leads found</p>
            <Link href="/search" className="btn-primary mt-4 text-sm">Start Search</Link>
          </div>
        )}
      </div>

      {/* ── Desktop: Table Layout ───────────────────────────── */}
      <div className="hidden md:block glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data?.items.length && (data?.items.length ?? 0) > 0}
                    onChange={selectAll}
                    className="rounded accent-brand-500"
                  />
                </th>
                <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Company</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Industry</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Location</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button
                    className="flex items-center gap-1"
                    onClick={() => setFilters({
                      ...filters,
                      sort_by: 'lead_score',
                      sort_dir: filters.sort_dir === 'desc' ? 'asc' : 'desc'
                    })}
                  >
                    Score
                    {filters.sort_by === 'lead_score'
                      ? filters.sort_dir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
                      : null
                    }
                  </button>
                </th>
                <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Rating</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="p-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="p-3">
                          <div className="skeleton h-4 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.items.map((lead: LeadListItem) => (
                    <tr key={lead.id} className="table-row-hover">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="rounded accent-brand-500"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{lead.company_name}</span>
                          {lead.website && (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-500 hover:text-accent-400 flex items-center gap-1 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe size={10} />
                              {lead.website.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-slate-300">{lead.industry || '—'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={11} />
                          {[lead.city, lead.state].filter(Boolean).join(', ') || lead.country || '—'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          {lead.emails[0] && (
                            <a href={`mailto:${lead.emails[0]}`} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                              <Mail size={10} /> {lead.emails[0].split('@')[0]}…
                            </a>
                          )}
                          {lead.phones[0] && (
                            <a href={`tel:${lead.phones[0]}`} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                              <Phone size={10} /> {lead.phones[0]}
                            </a>
                          )}
                          {!lead.emails[0] && !lead.phones[0] && (
                            <span className="text-xs text-slate-600">No contact</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <ScoreBadge score={lead.lead_score} />
                      </td>
                      <td className="p-3">
                        {lead.rating != null ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Star size={11} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-white">{lead.rating}</span>
                            <span className="text-slate-500">({lead.review_count})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <select
                          value={lead.status}
                          onChange={(e) => updateMutation.mutate({ id: lead.id, status: e.target.value })}
                          className={`text-xs rounded-lg px-2 py-1 bg-transparent border border-white/10 cursor-pointer ${STATUS_CLASSES[lead.status]}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-dark-800 text-white">{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                        >
                          <Eye size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!isLoading && !data?.items.length && (
          <div className="empty-state py-16">
            <Building2 size={40} className="text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium">No leads found</p>
            <p className="text-slate-600 text-sm mt-1">Start a search to discover leads</p>
            <Link href="/search" className="btn-primary mt-4 text-sm">
              Start Search
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between mt-4 gap-3">
          <p className="text-xs text-slate-400">
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, data?.total || 0)} of {data?.total} leads
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="flex items-center text-xs text-slate-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

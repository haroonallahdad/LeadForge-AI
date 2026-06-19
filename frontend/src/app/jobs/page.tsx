'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { searchApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Briefcase, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, Ban, RefreshCw, ChevronDown, ChevronUp, Play
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { SearchJob, JobStatus } from '@/types';

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: any }> = {
  queued: { label: 'Queued', color: 'text-slate-400 bg-slate-500/20 border-slate-500/30', icon: Clock },
  running: { label: 'Running', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: Loader2 },
  completed: { label: 'Completed', color: 'text-success-400 bg-success-500/20 border-success-500/30', icon: CheckCircle },
  failed: { label: 'Failed', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-slate-500 bg-slate-600/20 border-slate-600/30', icon: Ban },
};

function JobCard({ job, onCancel }: { job: SearchJob; onCancel: (id: string) => void }) {
  const [showLogs, setShowLogs] = useState(false);
  const cfg = STATUS_CONFIG[job.status];
  const Icon = cfg.icon;

  return (
    <div className="card-dark">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{job.industry_name}</h3>
            <span className={`badge border ${cfg.color}`}>
              <Icon size={11} className={job.status === 'running' ? 'animate-spin' : ''} />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {[job.city, job.state, job.country].filter(Boolean).join(', ')} ·
            {job.lead_count} leads requested
          </p>
          {job.current_step && (
            <p className="text-xs text-brand-400 mt-1 flex items-center gap-1">
              <Loader2 size={10} className={job.status === 'running' ? 'animate-spin' : ''} />
              {job.current_step}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-3">
          {(job.status === 'queued' || job.status === 'running') && (
            <button
              onClick={() => onCancel(job.id)}
              className="btn-danger text-xs py-1 px-2.5"
            >
              <Ban size={12} /> Cancel
            </button>
          )}
          {job.status === 'completed' && (
            <Link
              href={`/leads?job_id=${job.id}`}
              className="btn-primary text-xs py-1 px-2.5"
            >
              View Leads
            </Link>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(job.status === 'running' || job.status === 'queued') && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{job.progress}% complete</span>
            <span>{job.total_crawled}/{job.total_found} processed</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${job.progress}%` }} />
          </div>
        </div>
      )}

      {/* Stats */}
      {job.status === 'completed' && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Found', value: job.total_found },
            { label: 'Crawled', value: job.total_crawled },
            { label: 'Scored', value: job.total_scored },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {job.error_message && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
          <p className="text-xs text-red-400">{job.error_message}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 border-t border-white/5 pt-3">
        {job.created_at && (
          <span>Created: {new Date(job.created_at).toLocaleString()}</span>
        )}
        {job.started_at && (
          <span>Started: {new Date(job.started_at).toLocaleString()}</span>
        )}
        {job.completed_at && (
          <span>Completed: {new Date(job.completed_at).toLocaleString()}</span>
        )}
      </div>

      {/* Logs toggle */}
      {job.logs?.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
          >
            {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showLogs ? 'Hide' : 'Show'} logs ({job.logs.length})
          </button>
          {showLogs && (
            <div className="mt-2 p-3 rounded-lg bg-black/30 border border-white/5 space-y-1 font-mono text-xs max-h-40 overflow-y-auto">
              {job.logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600 flex-shrink-0">
                    {new Date(log.ts).toLocaleTimeString()}
                  </span>
                  <span className="text-slate-300">{log.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => searchApi.getJobs({ limit: 50 }),
    refetchInterval: 5000, // auto-refresh every 5s
  });

  const cancelMutation = useMutation({
    mutationFn: searchApi.cancelJob,
    onSuccess: () => {
      refetch();
      toast.success('Job cancelled');
    },
    onError: () => toast.error('Failed to cancel job'),
  });

  const running = data?.items.filter(j => j.status === 'running' || j.status === 'queued') || [];
  const completed = data?.items.filter(j => j.status === 'completed') || [];
  const failed = data?.items.filter(j => j.status === 'failed' || j.status === 'cancelled') || [];

  return (
    <DashboardLayout
      title="Search Jobs"
      subtitle="Background lead discovery jobs"
      actions={
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary text-xs py-1.5 px-3">
            <RefreshCw size={13} /> Refresh
          </button>
          <Link href="/search" className="btn-primary text-xs py-1.5 px-3">
            <Play size={13} /> New Search
          </Link>
        </div>
      }
    >
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-xl" />
          ))}
        </div>
      )}

      {/* Active / Running */}
      {running.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Active ({running.length})
          </h2>
          <div className="space-y-4">
            {running.map(job => (
              <JobCard key={job.id} job={job} onCancel={cancelMutation.mutate} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Completed ({completed.length})
          </h2>
          <div className="space-y-4">
            {completed.map(job => (
              <JobCard key={job.id} job={job} onCancel={cancelMutation.mutate} />
            ))}
          </div>
        </div>
      )}

      {/* Failed / Cancelled */}
      {failed.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Failed / Cancelled ({failed.length})
          </h2>
          <div className="space-y-4">
            {failed.map(job => (
              <JobCard key={job.id} job={job} onCancel={cancelMutation.mutate} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !data?.items.length && (
        <div className="empty-state">
          <Briefcase size={48} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium text-lg">No jobs yet</p>
          <p className="text-slate-600 text-sm mt-1 mb-5">Start a search to see jobs appear here</p>
          <Link href="/search" className="btn-primary">
            <Play size={16} /> Start New Search
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}

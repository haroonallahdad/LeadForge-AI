'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { exportApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Download, FileText, FileSpreadsheet, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExportsPage() {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');

  const exportMutation = useMutation({
    mutationFn: () => exportApi.export(format),
    onSuccess: () => toast.success(`${format.toUpperCase()} export downloaded!`),
    onError: () => toast.error('Export failed — ensure you have leads'),
  });

  return (
    <DashboardLayout title="Export Leads" subtitle="Download your leads in CSV or Excel format">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <Info size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-400">
            <p className="text-white font-medium mb-0.5">Export Includes:</p>
            <p>Company info, contact details (emails, phones, social links), website analysis, lead scores, opportunity notes, and CRM status.</p>
          </div>
        </div>

        {/* Format Selection */}
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white mb-4">Export Format</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'csv', label: 'CSV', desc: 'Universal format, works with Excel, Google Sheets, and any CRM', icon: FileText },
              { id: 'xlsx', label: 'Excel (XLSX)', desc: 'Formatted Excel file with styled headers and color-coded rows', icon: FileSpreadsheet },
            ] as const).map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFormat(id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  format === id
                    ? 'bg-brand-600/20 border-brand-500/50'
                    : 'bg-white/3 border-white/8 hover:border-white/15'
                }`}
              >
                <Icon size={20} className={format === id ? 'text-brand-400 mb-2' : 'text-slate-500 mb-2'} />
                <p className={`text-sm font-semibold mb-1 ${format === id ? 'text-white' : 'text-slate-300'}`}>{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="btn-primary w-full justify-center py-3.5 text-base"
        >
          {exportMutation.isPending ? (
            <><Loader2 size={18} className="animate-spin" /> Exporting...</>
          ) : (
            <><Download size={18} /> Export All Leads as {format.toUpperCase()}</>
          )}
        </button>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Shield, Key, Globe, Database, Zap, Info, AlertTriangle } from 'lucide-react';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolute sure you want to delete your account? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await authApi.deleteAccount();
      toast.success('Account deleted successfully');
      window.location.href = '/login';
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Settings" subtitle="Platform configuration and API keys">
      <div className="max-w-2xl space-y-5">
        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <Info size={15} className="text-brand-400 mt-0.5" />
          <p className="text-xs text-slate-400">
            All API keys and secrets are managed via the <code className="text-white font-mono">.env</code> file.
            Never expose API keys in the frontend. Edit the backend <code className="text-white font-mono">.env</code> file to configure integrations.
          </p>
        </div>

        {/* Adapter Status */}
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Globe size={14} className="text-accent-400" /> Data Source Adapters
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Mock Adapter', status: 'active', desc: 'Generates realistic demo data', env: 'USE_MOCK_ADAPTER=true' },
              { name: 'Google Places', status: 'inactive', desc: 'Requires GOOGLE_PLACES_API_KEY', env: 'GOOGLE_PLACES_API_KEY=...' },
              { name: 'Yelp', status: 'coming-soon', desc: 'Phase 2 — Yelp business listings', env: 'YELP_API_KEY=...' },
              { name: 'Yellow Pages', status: 'coming-soon', desc: 'Phase 2 — Web scraping adapter', env: 'N/A' },
            ].map(({ name, status, desc, env }) => (
              <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  status === 'active' ? 'bg-success-400 animate-pulse' :
                  status === 'inactive' ? 'bg-slate-500' : 'bg-amber-500/50'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{name}</span>
                    <span className={`badge text-xs ${
                      status === 'active' ? 'bg-success-500/20 text-success-400 border-success-500/30' :
                      status === 'inactive' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                      'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    } border`}>
                      {status === 'coming-soon' ? 'Phase 2' : status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <code className="text-xs text-slate-600 font-mono">{env}</code>
              </div>
            ))}
          </div>
        </div>

        {/* AI Config */}
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Zap size={14} className="text-brand-400" /> AI Integrations
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Email Generator', status: 'active', desc: 'Template-based (no API key needed)' },
              { name: 'OpenAI GPT-4o', status: 'coming-soon', desc: 'Phase 3 — Set OPENAI_API_KEY in .env' },
            ].map(({ name, status, desc }) => (
              <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-success-400' : 'bg-amber-500/50'}`} />
                <div>
                  <span className="text-sm font-medium text-white">{name}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Shield size={14} className="text-success-400" /> Security
          </h3>
          <div className="space-y-2 text-sm">
            {[
              'JWT Authentication enabled',
              'bcrypt password hashing',
              'Rate limiting active (60 req/min)',
              'SQL injection protection via SQLAlchemy ORM',
              'CORS configured for trusted origins only',
              'No sensitive data stored in frontend',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-success-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Ethical Compliance */}
        <div className="card-dark">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Database size={14} className="text-amber-400" /> Ethical Compliance
          </h3>
          <div className="space-y-2 text-sm">
            {[
              '✅ Only publicly available business data collected',
              '✅ No private or personal individual data scraped',
              '✅ No automated mass email sending',
              '✅ No authentication bypass on third-party sites',
              '✅ Rate limiting on all crawls (2s delay between requests)',
              '✅ Bot identified in User-Agent string',
              '✅ Manual outreach only — drafts provided, user sends',
            ].map((item) => (
              <p key={item} className="text-slate-300 text-xs leading-relaxed">{item}</p>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card-dark border-red-500/20">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-4">
            <AlertTriangle size={14} /> Danger Zone
          </h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
            <div>
              <h4 className="text-sm font-medium text-white">Delete Account</h4>
              <p className="text-xs text-slate-400 mt-1">Permanently delete your account and all associated data.</p>
            </div>
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

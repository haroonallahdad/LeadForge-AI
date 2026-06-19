'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Key, Link as LinkIcon, RefreshCw, Copy, Check, Lock } from 'lucide-react';
import Link from 'next/link';

export default function IntegrationsPage() {
  const router = useRouter();
  const { user, isLoading } = useUser({ redirectTo: '/login' });
  const [apiKey, setApiKey] = useState('lf_live_9a8b7c6d5e4f3g2h1i0j');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // If not premium, they can see the page but it's locked.
  }, [user, isLoading]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('API Key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateKey = () => {
    setApiKey('lf_live_' + Math.random().toString(36).substr(2, 16));
    toast.success('New API Key generated. Old key is now invalid.');
  };

  const isPremium = user?.subscription_plan === 'PREMIUM' || user?.role === 'admin';

  return (
    <DashboardLayout title="API & Integrations" subtitle="Connect LeadForge AI to your CRM">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {!isPremium && !isLoading && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-accent-500/10 to-brand-500/10 border border-accent-500/20 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <Lock size={24} className="text-accent-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Premium Feature</h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-6">
              Developer API access and CRM integrations are exclusively available on the Premium plan. Upgrade to unlock powerful automation.
            </p>
            <Link href="/upgrade" className="btn-primary py-3 px-8 text-base">
              Upgrade to Premium
            </Link>
          </div>
        )}

        <div className={`space-y-8 ${!isPremium ? 'opacity-50 pointer-events-none blur-sm select-none' : ''}`}>
          
          {/* API Key Card */}
          <div className="card-dark p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              <Key className="text-brand-400" size={20} /> Developer API Key
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Use this key to authenticate your requests to the LeadForge API. Keep it secret!
            </p>

            <div className="flex gap-3">
              <div className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-3 font-mono text-sm text-slate-300 flex items-center justify-between">
                <span>{apiKey.replace(/./g, '•').slice(0, 20)}</span>
              </div>
              <button onClick={copyToClipboard} className="btn-secondary px-4">
                {copied ? <Check size={18} className="text-success-400" /> : <Copy size={18} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={regenerateKey} className="btn-secondary px-4 text-red-400 hover:text-red-300 hover:border-red-500/30">
                <RefreshCw size={18} /> Roll Key
              </button>
            </div>
          </div>

          {/* CRM Integrations */}
          <div className="card-dark p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              <LinkIcon className="text-accent-400" size={20} /> CRM Webhooks
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Automatically send fully scored leads to your CRM as soon as a search finishes.
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">HubSpot</h3>
                  <p className="text-xs text-slate-400 mt-1">Sync contacts and website audit properties.</p>
                </div>
                <button className="btn-secondary text-xs">Connect</button>
              </div>

              <div className="p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Salesforce</h3>
                  <p className="text-xs text-slate-400 mt-1">Create leads and append enrichment data.</p>
                </div>
                <button className="btn-secondary text-xs">Connect</button>
              </div>

              <div className="p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">GoHighLevel</h3>
                  <p className="text-xs text-slate-400 mt-1">Trigger outreach campaigns automatically.</p>
                </div>
                <button className="btn-secondary text-xs">Connect</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

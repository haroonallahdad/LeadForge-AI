'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUser } from '@/lib/hooks/useUser';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Key, Copy, Check, RefreshCw, Lock, Trash2,
  Send, Zap, CheckCircle2, AlertCircle, ExternalLink, Globe
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function IntegrationsPage() {
  const { user, isLoading } = useUser({ redirectTo: '/login' });
  const [apiKey] = useState('lf_' + (typeof window !== 'undefined' ? (localStorage.getItem('leadforge_token') || '').slice(0, 20) : '••••••••••••••••••••'));
  const [copied, setCopied] = useState(false);

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; http_status?: number } | null>(null);

  const isPremium = user?.subscription_plan === 'PREMIUM' || user?.role === 'admin';

  // Load saved webhook URL from backend
  useEffect(() => {
    if (!user || !isPremium) return;
    api.get('/webhooks/').then(res => {
      setSavedUrl(res.data.webhook_url || '');
      setWebhookUrl(res.data.webhook_url || '');
    }).catch(() => {});
  }, [user, isPremium]);

  const copyApiKey = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('leadforge_token') || '' : '';
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success('API Token copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const saveWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }
    if (!webhookUrl.startsWith('http')) {
      toast.error('URL must start with http:// or https://');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/webhooks/', { url: webhookUrl.trim() });
      setSavedUrl(webhookUrl.trim());
      toast.success('Webhook URL saved!');
      setTestResult(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save webhook');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteWebhook = async () => {
    if (!confirm('Remove this webhook URL?')) return;
    try {
      await api.delete('/webhooks/');
      setSavedUrl('');
      setWebhookUrl('');
      setTestResult(null);
      toast.success('Webhook removed');
    } catch {
      toast.error('Failed to remove webhook');
    }
  };

  const testWebhook = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/webhooks/test');
      setTestResult({ status: 'success', http_status: res.data.http_status });
      toast.success(`Test delivered! (HTTP ${res.data.http_status})`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Delivery failed';
      setTestResult({ status: 'error' });
      toast.error(detail);
    } finally {
      setIsTesting(false);
    }
  };

  const COMPATIBLE_APPS = [
    { name: 'Zapier', color: 'text-orange-400', url: 'https://zapier.com/apps/webhook/integrations' },
    { name: 'n8n', color: 'text-red-400', url: 'https://n8n.io' },
    { name: 'Make.com', color: 'text-purple-400', url: 'https://make.com' },
    { name: 'HubSpot', color: 'text-orange-500', url: 'https://hubspot.com' },
    { name: 'GoHighLevel', color: 'text-cyan-400', url: 'https://gohighlevel.com' },
    { name: 'Salesforce', color: 'text-blue-400', url: 'https://salesforce.com' },
  ];

  return (
    <DashboardLayout title="API & Integrations" subtitle="Connect LeadForge AI to your CRM or automation platform">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Premium Gate */}
        {!isPremium && !isLoading && (
          <div className="p-8 rounded-2xl bg-gradient-to-r from-accent-500/10 to-brand-500/10 border border-accent-500/20 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <Lock size={24} className="text-accent-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Premium Feature</h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-6">
              Developer API access and CRM webhooks are exclusively available on the Premium plan.
            </p>
            <Link href="/upgrade" className="btn-primary py-3 px-8 text-base">
              Upgrade to Premium
            </Link>
          </div>
        )}

        <div className={`space-y-6 ${!isPremium ? 'opacity-40 pointer-events-none blur-sm select-none' : ''}`}>

          {/* ── API Key Card ─────────────────────────────────── */}
          <div className="card-dark p-6">
            <div className="flex items-center gap-2 mb-1">
              <Key className="text-brand-400" size={20} />
              <h2 className="text-lg font-bold text-white">Your API Bearer Token</h2>
            </div>
            <p className="text-sm text-slate-400 mb-5">
              Attach this as a <code className="text-white bg-slate-800 px-1 rounded text-xs">Authorization: Bearer &lt;token&gt;</code> header on every request to the LeadForge API.
            </p>

            <div className="flex gap-3">
              <div className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-3 font-mono text-sm text-slate-400 truncate">
                {Array(24).fill('•').join('')}
              </div>
              <button onClick={copyApiKey} className="btn-secondary px-4 flex-shrink-0">
                {copied ? <Check size={18} className="text-success-400" /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 flex items-center gap-1">
              <AlertCircle size={11} />
              Your JWT session token. Keep it secret — anyone with this token can read your data.
            </p>
          </div>

          {/* ── Webhook Card ─────────────────────────────────── */}
          <div className="card-dark p-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="text-accent-400" size={20} />
              <h2 className="text-lg font-bold text-white">CRM Webhook</h2>
            </div>
            <p className="text-sm text-slate-400 mb-2">
              When a search completes, LeadForge will POST a JSON payload of all scored leads to this URL.
              Works with any platform that accepts webhooks.
            </p>

            {/* Compatible platforms */}
            <div className="flex flex-wrap gap-2 mb-6">
              {COMPATIBLE_APPS.map(app => (
                <a
                  key={app.name}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors ${app.color}`}
                >
                  {app.name} ↗
                </a>
              ))}
            </div>

            {/* URL Input */}
            <label className="block text-xs text-slate-400 mb-2 font-medium">Webhook Endpoint URL</label>
            <div className="flex gap-3 mb-3">
              <div className="relative flex-1">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="input-dark pl-8 text-sm w-full"
                />
              </div>
              <button
                onClick={saveWebhook}
                disabled={isSaving}
                className="btn-primary px-4 text-sm flex-shrink-0"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : 'Save'}
              </button>
            </div>

            {/* Status & Actions */}
            {savedUrl && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-success-500/10 border border-success-500/20 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-success-400 flex-shrink-0" />
                  <span className="text-xs text-success-300 font-medium">Webhook active</span>
                  <span className="text-xs text-slate-500 truncate max-w-[180px]">{savedUrl}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={testWebhook}
                    disabled={isTesting}
                    className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"
                  >
                    {isTesting
                      ? <RefreshCw size={12} className="animate-spin" />
                      : <Send size={12} />
                    }
                    {isTesting ? 'Sending...' : 'Send Test'}
                  </button>
                  <button
                    onClick={deleteWebhook}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors px-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Test result feedback */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs ${
                testResult.status === 'success'
                  ? 'bg-success-500/10 border-success-500/20 text-success-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}>
                {testResult.status === 'success'
                  ? `✅ Test payload delivered successfully (HTTP ${testResult.http_status}). Check your CRM to confirm it arrived.`
                  : '❌ Delivery failed. Make sure the URL is publicly reachable and accepts POST requests.'}
              </div>
            )}

            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-white/5">
              <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Sample Payload</p>
              <pre className="text-xs text-slate-400 overflow-x-auto leading-relaxed">{`{
  "event": "lead.created",
  "source": "LeadForge AI",
  "lead": {
    "company_name": "Acme Dental Group",
    "industry": "Dental Clinics",
    "city": "Austin", "state": "TX",
    "email": "info@acme-dental.com",
    "phone": "+1-512-555-0199",
    "lead_score": 187,
    "rating": 4.2
  }
}`}</pre>
            </div>
          </div>

          {/* ── REST API Docs link ────────────────────────────── */}
          <div className="card-dark p-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1">API Documentation</h3>
              <p className="text-sm text-slate-400">Full REST API docs with endpoint reference and examples.</p>
            </div>
            <Link href="/docs" className="btn-secondary text-sm px-4 flex-shrink-0 flex items-center gap-2">
              <ExternalLink size={14} /> View Docs
            </Link>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

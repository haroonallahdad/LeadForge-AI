'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, emailApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Globe, Mail, Phone, Facebook, Instagram, Linkedin, Twitter,
  FileText, CheckCircle, XCircle,
  Plus, Send, Copy, ArrowLeft, Target, Briefcase, MapPin,
  Loader2, TrendingUp, Star
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { use } from 'react';
import type { LeadStatus } from '@/types';

const STATUS_OPTIONS: LeadStatus[] = [
  'new', 'researching', 'contacted', 'follow_up', 'interested',
  'meeting_scheduled', 'proposal_sent', 'closed_won', 'closed_lost', 'rejected'
];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New', researching: 'Researching', contacted: 'Contacted',
  follow_up: 'Follow Up', interested: 'Interested', meeting_scheduled: 'Meeting Scheduled',
  proposal_sent: 'Proposal Sent', closed_won: '✅ Closed Won', closed_lost: 'Closed Lost', rejected: 'Rejected',
};

function CheckItem({ label, value }: { label: string; value: boolean | undefined }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {value
        ? <CheckCircle size={14} className="text-success-400 flex-shrink-0" />
        : <XCircle size={14} className="text-slate-600 flex-shrink-0" />}
      <span className={value ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
    </div>
  );
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [emailTone, setEmailTone] = useState('professional');
  const [emailDraft, setEmailDraft] = useState<any>(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getLead(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => leadsApi.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Lead updated');
    },
  });

  const noteMutation = useMutation({
    mutationFn: (content: string) => leadsApi.addNote(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setNewNote('');
      toast.success('Note added');
    },
  });

  const handleGenerateEmail = async () => {
    if (!lead) return;
    setGeneratingEmail(true);
    try {
      const draft = await emailApi.generate({
        company_name: lead.company_name,
        executive_name: lead.executives?.[0]?.name,
        industry: lead.industry || undefined,
        website_issues: lead.website_analysis?.improvement_summary?.split('.').filter(Boolean) || [],
        recommended_services: lead.opportunity_insight?.recommended_services || [],
        tone: emailTone,
      });
      setEmailDraft(draft);
    } catch {
      toast.error('Failed to generate email');
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    if (emailDraft) {
      navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`);
      toast.success('Email copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Lead Details">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout title="Lead Not Found">
        <div className="empty-state">
          <p className="text-slate-400">Lead not found</p>
          <Link href="/leads" className="btn-primary mt-4">Back to Leads</Link>
        </div>
      </DashboardLayout>
    );
  }

  const wa = lead.website_analysis;
  const insight = lead.opportunity_insight;
  const primaryContact = lead.contact_info?.[0] ?? null;

  const scoreColor = lead.lead_score >= 150 ? 'text-success-400' : lead.lead_score >= 80 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = lead.lead_score >= 150 ? 'bg-success-500/15 border-success-500/25' : lead.lead_score >= 80 ? 'bg-yellow-500/15 border-yellow-500/25' : 'bg-red-500/15 border-red-500/25';

  return (
    <DashboardLayout
      title={lead.company_name}
      subtitle={`${lead.industry} · ${[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}`}
      actions={
        <div className="flex gap-2">
          <Link href="/leads" className="btn-secondary text-xs py-1.5 px-3">
            <ArrowLeft size={13} /> Back
          </Link>
          <select
            value={lead.status}
            onChange={(e) => updateMutation.mutate({ status: e.target.value })}
            className="input-dark text-xs py-1.5 px-3 w-44"
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-5">
          {/* Company Info */}
          <div className="card-dark">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">{lead.company_name}</h2>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin size={13} />
                  {[lead.address || [lead.city, lead.state].filter(Boolean).join(', '), lead.country].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className={`flex flex-col items-center px-4 py-3 rounded-xl border ${scoreBg}`}>
                <span className={`text-2xl font-bold ${scoreColor}`}>{lead.lead_score}</span>
                <span className="text-xs text-slate-400 mt-0.5">Lead Score</span>
              </div>
            </div>

            {/* Website */}
            {lead.website && (
              <div className="flex items-center gap-2 mb-4">
                <Globe size={14} className="text-slate-500" />
                <a href={lead.website} target="_blank" rel="noopener noreferrer"
                   className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1">
                  {lead.website}
                </a>
              </div>
            )}

            {/* Rating */}
            {lead.rating != null && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.round(lead.rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'} />
                  ))}
                </div>
                <span className="text-sm text-white">{lead.rating}</span>
                <span className="text-xs text-slate-500">({lead.review_count} reviews)</span>
              </div>
            )}

            {/* Contacts */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Emails */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Mail size={11} /> Emails
                </p>
                {lead.emails?.length ? (
                  <div className="space-y-1">
                    {lead.emails.map((email, i) => (
                      <a key={i} href={`mailto:${email}`}
                         className="text-sm text-white hover:text-brand-300 block">{email}</a>
                    ))}
                  </div>
                ) : <span className="text-xs text-slate-600">Not found</span>}
              </div>
              {/* Phones */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Phone size={11} /> Phones
                </p>
                {lead.phones?.length ? (
                  <div className="space-y-1">
                    {lead.phones.map((phone, i) => (
                      <a key={i} href={`tel:${phone}`} className="text-sm text-white hover:text-brand-300 block">{phone}</a>
                    ))}
                  </div>
                ) : <span className="text-xs text-slate-600">Not found</span>}
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
              {primaryContact?.facebook_url && (
                <a href={primaryContact.facebook_url} target="_blank" rel="noopener noreferrer"
                   className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors">
                  <Facebook size={16} />
                </a>
              )}
              {primaryContact?.instagram_url && (
                <a href={primaryContact.instagram_url} target="_blank" rel="noopener noreferrer"
                   className="p-2 rounded-lg bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 transition-colors">
                  <Instagram size={16} />
                </a>
              )}
              {primaryContact?.linkedin_url && (
                <a href={primaryContact.linkedin_url} target="_blank" rel="noopener noreferrer"
                   className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors">
                  <Linkedin size={16} />
                </a>
              )}
              {primaryContact?.twitter_url && (
                <a href={primaryContact.twitter_url} target="_blank" rel="noopener noreferrer"
                   className="p-2 rounded-lg bg-slate-600/20 text-slate-400 hover:bg-slate-600/30 transition-colors">
                  <Twitter size={16} />
                </a>
              )}
              {!primaryContact?.facebook_url && !primaryContact?.instagram_url && !primaryContact?.linkedin_url && !primaryContact?.twitter_url && (
                <span className="text-xs text-slate-600">No social links found</span>
              )}
            </div>
          </div>

          {/* Website Analysis */}
          {wa && (
            <div className="card-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Globe size={14} className="text-accent-400" /> Website Analysis
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Score:</span>
                  <span className={`font-bold ${wa.website_score >= 60 ? 'text-success-400' : wa.website_score >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {wa.website_score}/100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                <CheckItem label="Website Exists" value={wa.website_exists} />
                <CheckItem label="SSL (HTTPS)" value={wa.ssl_enabled} />
                <CheckItem label="Mobile Responsive" value={wa.mobile_responsive} />
                <CheckItem label="Contact Form" value={wa.has_contact_form} />
                <CheckItem label="CTA Button" value={wa.has_cta_button} />
                <CheckItem label="Social Links" value={wa.has_social_links} />
                <CheckItem label="SEO Title" value={wa.has_seo_title} />
                <CheckItem label="SEO Description" value={wa.has_seo_description} />
              </div>

              {wa.improvement_summary && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs font-semibold text-amber-400 mb-1">Improvement Opportunities:</p>
                  <p className="text-xs text-slate-300">{wa.improvement_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Opportunity Insight */}
          {insight?.ai_notes && (
            <div className="card-dark">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-brand-400" /> Opportunity Insight
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{insight.ai_notes}</p>

              {insight.recommended_services?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-slate-500 mb-2">Recommended Services:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {insight.recommended_services.map((svc, i) => (
                      <span key={i} className="badge bg-brand-500/15 text-brand-300 border border-brand-500/25">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Generator */}
          <div className="card-dark">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Send size={14} className="text-success-400" /> AI Email Draft Generator
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ⚠️ Draft only — copy and send manually. No automated sending.
            </p>

            <div className="flex gap-3 mb-4">
              {(['professional', 'friendly', 'short'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setEmailTone(tone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                    emailTone === tone
                      ? 'bg-brand-600/30 border-brand-500/50 text-brand-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateEmail}
              disabled={generatingEmail}
              className="btn-primary text-sm mb-4"
            >
              {generatingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {generatingEmail ? 'Generating...' : 'Generate Email Draft'}
            </button>

            {emailDraft && (
              <div className="glass rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-400">Generated Draft</p>
                  <button onClick={handleCopyEmail} className="btn-secondary text-xs py-1 px-2.5">
                    <Copy size={11} /> Copy
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-1">Subject:</p>
                <p className="text-sm text-white font-medium mb-3">{emailDraft.subject}</p>
                <p className="text-xs text-slate-400 mb-1">Body:</p>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {emailDraft.body}
                </pre>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card-dark">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <FileText size={14} className="text-slate-400" /> Notes
            </h3>
            <div className="flex gap-2 mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="input-dark flex-1 resize-none"
              />
              <button
                onClick={() => newNote.trim() && noteMutation.mutate(newNote.trim())}
                className="btn-primary px-3"
                disabled={!newNote.trim() || noteMutation.isPending}
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {lead.notes?.map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-white/3 border border-white/5">
                  <p className="text-sm text-slate-300">{note.content}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {!lead.notes?.length && (
                <p className="text-xs text-slate-600">No notes yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Executive Info */}
          <div className="card-dark">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Briefcase size={14} className="text-amber-400" /> Key Executives
            </h3>
            {lead.executives?.length ? (
              <div className="space-y-3">
                {lead.executives.map((exec) => (
                  <div key={exec.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-brand-300">
                        {exec.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{exec.name}</p>
                      {exec.position && <p className="text-xs text-slate-400">{exec.position}</p>}
                      {exec.linkedin && (
                        <a href={exec.linkedin} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1">
                          <Linkedin size={10} /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">No executives discovered</p>
            )}
          </div>

          {/* Lead Metadata */}
          <div className="card-dark">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Target size={14} className="text-brand-400" /> Lead Details
            </h3>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Source', value: lead.source },
                { label: 'Country', value: lead.country },
                { label: 'State', value: lead.state },
                { label: 'Industry', value: lead.industry },
                { label: 'Website Score', value: lead.website_score ? `${lead.website_score}/100` : 'N/A' },
                { label: 'Added', value: lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-white text-xs">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact History */}
          <div className="card-dark">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Phone size={14} className="text-green-400" /> Contact History
            </h3>
            {lead.contact_history?.length ? (
              <div className="space-y-2">
                {lead.contact_history.map((h) => (
                  <div key={h.id} className="flex gap-2 text-xs">
                    <span className="text-slate-500">{new Date(h.timestamp).toLocaleDateString()}</span>
                    <span className="text-slate-300">{h.action}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">No contact history</p>
            )}
            <button
              onClick={() => leadsApi.addHistory(id, 'Email sent').then(() => {
                queryClient.invalidateQueries({ queryKey: ['lead', id] });
                toast.success('History logged');
              })}
              className="btn-secondary text-xs py-1.5 px-3 mt-3 w-full justify-center"
            >
              <Plus size={12} /> Log Contact
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

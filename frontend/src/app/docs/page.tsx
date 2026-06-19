'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookOpen, Zap, Target, Shield, CheckCircle2, Link as LinkIcon, Database, Mail } from 'lucide-react';

export default function DocsPage() {
  return (
    <DashboardLayout title="Documentation" subtitle="LeadForge AI Version 2.0 Official Guide">
      <div className="max-w-4xl mx-auto space-y-12 pb-12">
        
        {/* Header */}
        <div className="card-dark p-8 border-brand-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <BookOpen size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">LeadForge AI v2.0</h1>
              <p className="text-slate-400">Comprehensive Platform Documentation</p>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Welcome to the official documentation for LeadForge AI Version 2.0. This major release transforms the internal lead generation tool into a full-fledged, multi-tenant SaaS platform. Below you will find details on architecture, features, workflows, and access controls.
          </p>
        </div>

        {/* Core Architecture */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-brand-400" size={20} /> Core Architecture
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-dark p-6">
              <h3 className="font-semibold text-white mb-3">Backend (FastAPI)</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The backend is built with Python 3.12 and FastAPI. It uses asynchronous SQLAlchemy (with `asyncpg`) to connect to a Neon.tech serverless PostgreSQL database. It features robust JWT authentication, background task processing for web scraping, and role-based access control (RBAC).
              </p>
            </div>
            <div className="card-dark p-6">
              <h3 className="font-semibold text-white mb-3">Frontend (Next.js)</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The frontend uses Next.js 15 (App Router) with React 19. It leverages Tailwind CSS for styling and React Query for intelligent data caching. The UI is designed with a "glassmorphism" aesthetic, providing a premium, modern experience.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Breakdown */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="text-accent-400" size={20} /> Feature Breakdown
          </h2>
          <div className="space-y-4">
            
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Target size={16} className="text-brand-400" /> 1. Autonomous Lead Discovery
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The platform accepts an industry and location, then utilizes parallel asynchronous web crawlers to search public directories (like Yelp, YellowPages, etc.) to discover active businesses. It extracts names, addresses, and website URLs.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Shield size={16} className="text-success-400" /> 2. Deep Website Analysis & Scoring
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                For every lead discovered, the system visits their website and performs a heuristic analysis to calculate a "Lead Score" (0-100). Higher scores indicate businesses that desperately need IT services. The AI checks for:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-success-400"/> SSL Certificate validity</li>
                <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-success-400"/> Mobile responsiveness heuristics</li>
                <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-success-400"/> Presence of contact forms or modern frameworks</li>
                <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-success-400"/> Social media links and SEO metadata</li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Mail size={16} className="text-brand-400" /> 3. AI Email Generation (Premium)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Using Hugging Face Inference endpoints, LeadForge AI can automatically draft hyper-personalized cold outreach emails. It references the specific flaws found on the target's website (e.g., "I noticed your SSL is expired") to dramatically increase response rates.
              </p>
            </div>

          </div>
        </section>

        {/* Roles & Plans */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-brand-400" size={20} /> Access Control & Plans
          </h2>
          <div className="card-dark overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="font-semibold text-white mb-2">User Roles</h3>
              <p className="text-sm text-slate-400">
                <strong>Admin:</strong> Has full access to the platform, including the Admin Panel to approve users and manually verify payment proofs. (Restricted to the root email).<br/>
                <strong>Analyst:</strong> Standard user role. Must be explicitly approved by an Admin before they can log in.
              </p>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-white mb-4">Subscription Tiers</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="font-semibold text-white">Free Plan</span>
                  <span className="text-sm text-slate-400">Max 10 leads / search. 25 leads / month.</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="font-semibold text-brand-400">Simple Plan</span>
                  <span className="text-sm text-slate-400">Max 500 leads / month. ($5/mo)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-brand-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <span className="font-semibold text-accent-400">Premium Plan</span>
                  <span className="text-sm text-slate-400">Unlimited leads. Full feature access. ($15/mo)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* API Integrations Note */}
        <section className="card-dark p-6 border-accent-500/30">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
            <LinkIcon className="text-accent-400" size={18} /> Developer Integrations
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Premium users have access to the Developer Integrations suite. This allows seamless export and direct webhook integration into standard CRMs like HubSpot, Salesforce, and GoHighLevel. Head over to the Integrations tab on the sidebar to generate your API keys.
          </p>
        </section>

      </div>
    </DashboardLayout>
  );
}

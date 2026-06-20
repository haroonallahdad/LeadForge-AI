'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { ArrowRight, Search, Target, MapPin, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (authApi.isLoggedIn()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-brand-500/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-strong border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">LeadForge <span className="text-brand-400">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/login?mode=register" className="btn-primary py-2 px-5 text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Lead Intelligence for the Modern Web
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
            Stop Searching.<br/>
            Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">Closing.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            LeadForge AI automatically discovers local B2B businesses, analyzes their websites for weaknesses, and scores them based on the likelihood of needing your digital services.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login?mode=register" className="btn-primary py-4 px-8 text-base w-full sm:w-auto shadow-lg shadow-brand-500/25 group">
              Start Free Trial 
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative border-t border-white/5 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How LeadForge AI Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Our autonomous agents do the heavy lifting so you can focus on outreach.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-dark p-8">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-6">
                <Search className="text-brand-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">1. Smart Discovery</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Simply enter an industry and city. LeadForge scans multiple sources to build a comprehensive list of active local businesses.</p>
            </div>
            <div className="card-dark p-8">
              <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mb-6">
                <Target className="text-accent-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">2. Website Analysis</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Our AI visits their websites to check for SEO gaps, missing SSL, slow load speeds, and missing contact forms.</p>
            </div>
            <div className="card-dark p-8">
              <div className="w-12 h-12 rounded-xl bg-success-500/10 flex items-center justify-center mb-6">
                <MapPin className="text-success-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">3. Lead Scoring</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Businesses are scored 0-100 based on how badly they need your services, prioritizing companies without modern web infrastructure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 relative" id="pricing">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400">Choose the plan that fits your agency.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="card-dark p-8 relative overflow-hidden group border-transparent hover:border-white/10 transition-colors flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Free Plan</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-slate-400">/ forever</span>
              </div>
              <p className="text-sm text-slate-400 mb-8 h-10">Perfect for exploring the platform capabilities.</p>
              
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-slate-500" />
                  <span><strong>10 leads</strong> per search</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-slate-500" />
                  <span>Max 50 leads / month</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-slate-500" />
                  <span>Basic Heuristic Scoring</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-slate-500" />
                  <span>CSV Export</span>
                </li>
              </ul>
              <Link href="/login?mode=register" className="btn-secondary w-full justify-center py-3 border border-white/10 hover:bg-white/5 text-slate-300 mt-auto">Get Started</Link>
            </div>

            {/* Simple Plan */}
            <div className="card-dark p-8 relative overflow-hidden group flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
              <h3 className="text-2xl font-bold text-white mb-2">Simple Plan</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-extrabold text-white">$5</span>
                <span className="text-slate-400">/ month</span>
              </div>
              <p className="text-sm text-slate-400 mb-8 h-10">Perfect for freelance developers starting their outreach.</p>
              
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-brand-400" />
                  <span>Up to <strong>500 leads</strong> per month</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-brand-400" />
                  <span>Basic Website Analysis</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-brand-400" />
                  <span>Email & Phone Extraction</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-brand-400" />
                  <span>CSV Export</span>
                </li>
              </ul>
              <Link href="/login?mode=register" className="btn-secondary w-full justify-center py-3 mt-auto">Choose Simple</Link>
            </div>

            {/* Premium Plan */}
            <div className="card-dark p-8 relative overflow-hidden border-brand-500/50 shadow-2xl shadow-brand-500/10 group flex flex-col">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 to-accent-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
              <div className="absolute top-4 right-4 bg-brand-500/20 text-brand-400 text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Premium Plan</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-extrabold text-white">$15</span>
                <span className="text-slate-400">/ month</span>
              </div>
              <p className="text-sm text-slate-400 mb-8 h-10">For agencies scaling their B2B client acquisition.</p>
              
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-accent-400" />
                  <span><strong>Unlimited leads</strong> per month</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-accent-400" />
                  <span>Advanced Tech Stack Detection</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-accent-400" />
                  <span>Executive Social Profiling</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={18} className="text-accent-400" />
                  <span>AI Pitch Generation</span>
                </li>
              </ul>
              <Link href="/login?mode=register" className="btn-primary w-full justify-center py-3 mt-auto">Choose Premium</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-slate-950 text-center">
        <p className="text-slate-500 text-sm mb-4">© 2026 LeadForge AI. Crafted by Tech Harbor.</p>
        <p className="text-slate-600 text-xs">For support, please contact your administrator.</p>
      </footer>
    </div>
  );
}

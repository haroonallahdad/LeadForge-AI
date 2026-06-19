'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await authApi.login(form.email, form.password);
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else if (mode === 'register') {
        await authApi.register(form.email, form.password, form.full_name);
        toast.success('Account created!');
        router.push('/dashboard');
      } else if (mode === 'forgot') {
        await authApi.forgotPassword(form.email);
        toast.success('If an account exists, a reset link has been sent to your email.');
        setMode('login');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative w-full max-w-md mx-auto px-4 animate-slide-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 24L14 8l6 10 4-6 6 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="24" cy="8" r="3" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">LeadForge <span className="gradient-text">AI</span></h1>
          <p className="text-slate-400 text-sm">B2B Lead Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-glass">
          {/* Tabs */}
          {mode !== 'forgot' && (
            <div className="flex bg-white/5 rounded-xl p-1 mb-6">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    mode === m
                      ? 'bg-brand-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-sm text-slate-400">Enter your email and we'll send you a reset link.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="John Smith"
                  required
                  className="input-dark"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                required
                autoComplete="off"
                className="input-dark"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input-dark"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === 'login' ? 'Signing in...' : mode === 'register' ? 'Creating account...' : 'Sending link...'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {mode === 'login' && (
              <button onClick={() => setMode('forgot')} className="hover:text-brand-400 transition-colors">
                Forgot your password?
              </button>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="hover:text-brand-400 transition-colors">
                Back to Sign In
              </button>
            )}
          </div>

          {/* Demo hint removed */}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          LeadForge AI by Tech Harbor · B2B Lead Intelligence
        </p>
      </div>
    </div>
  );
}

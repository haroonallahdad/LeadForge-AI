'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    authApi.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
        toast.success(res.message);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Verification failed. The token may be expired.');
      });
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full text-center shadow-glass">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Verifying Email</h2>
            <p className="text-sm text-slate-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-success-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-success-400 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-sm text-slate-400 mb-6">{message}</p>
            <p className="text-xs text-slate-500">Redirecting to login...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="text-red-400 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-sm text-slate-400 mb-6">{message}</p>
            <Link href="/login" className="btn-secondary w-full justify-center py-2">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-600/20 blur-[120px] rounded-full pointer-events-none" />
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">LF</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">LeadForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">AI</span></span>
          </Link>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </main>
  );
}

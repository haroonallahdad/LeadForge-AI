'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (authApi.isLoggedIn()) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand animate-pulse" />
        <p className="text-slate-400 text-sm">Loading LeadForge AI...</p>
      </div>
    </div>
  );
}

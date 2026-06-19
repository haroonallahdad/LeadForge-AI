'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, CheckCircle2, CreditCard, Shield } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';

export default function UpgradePage() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<'SIMPLE' | 'PREMIUM'>('SIMPLE');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a payment screenshot first.');
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        // This endpoint will be handled by the backend (need to create a user-facing endpoint for this)
        // Wait, we didn't create a user-facing endpoint for uploading payment proofs in the backend!
        // We will create it right after this file.
        await api.post('/api/v1/payments/upload', {
          plan_requested: selectedPlan,
          proof_image_base64: base64Image
        });
        
        toast.success('Payment proof uploaded successfully! Admin will review shortly.');
        setFile(null);
        router.push('/dashboard');
      };
      reader.onerror = () => {
        toast.error('Failed to read file.');
        setIsUploading(false);
      };
    } catch (err: any) {
      toast.error('Failed to upload payment proof.');
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout title="Upgrade Plan" subtitle="Unlock more leads and advanced features">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Current Plan Badge */}
        {user && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-white/10">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${user.subscription_plan === 'PREMIUM' ? 'bg-accent-500/20 text-accent-400' : user.subscription_plan === 'SIMPLE' ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-400'}`}>
              <Shield size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Current Plan</p>
              <p className="text-white font-bold">{user.subscription_plan}</p>
            </div>
          </div>
        )}

        {/* Payment Details Card */}
        <div className="card-dark p-6 border-brand-500/30">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="text-brand-400" /> Payment Instructions
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            To upgrade your account, please send the exact amount for your selected plan to one of the accounts below. Then, upload a screenshot of your successful transaction.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-2">Jazz Cash</h3>
              <p className="text-2xl font-mono text-brand-400 mb-1">03221224382</p>
              <p className="text-xs text-slate-500">Account Title: Haroon Allah Dad</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-2">Meezan Bank</h3>
              <p className="text-sm font-mono text-slate-300 mb-1">PK71MEZN0000300111969617</p>
              <p className="text-xs text-slate-500 mb-0.5">Account No: 00300111969617</p>
              <p className="text-xs text-slate-500 mb-0.5">Title: HAROON ALLAH DAD</p>
              <p className="text-xs text-slate-500">Branch: MEEZAN DIGITAL CENTRE</p>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Plan Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white mb-2">1. Select Plan</h3>
            
            <button 
              onClick={() => setSelectedPlan('SIMPLE')}
              disabled={user?.subscription_plan === 'SIMPLE' || user?.subscription_plan === 'PREMIUM'}
              className={`w-full text-left p-5 rounded-xl border transition-all ${
                user?.subscription_plan === 'SIMPLE' || user?.subscription_plan === 'PREMIUM'
                  ? 'bg-slate-900 border-white/5 opacity-50 cursor-not-allowed'
                  : selectedPlan === 'SIMPLE' 
                  ? 'bg-brand-500/10 border-brand-500/50 ring-1 ring-brand-500/50' 
                  : 'bg-slate-900 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white text-lg">Simple Plan {user?.subscription_plan === 'SIMPLE' && '(Current)'}</span>
                <span className="text-xl font-bold text-brand-400">$5</span>
              </div>
              <p className="text-xs text-slate-400">Up to 500 leads per month.</p>
            </button>

            <button 
              onClick={() => setSelectedPlan('PREMIUM')}
              disabled={user?.subscription_plan === 'PREMIUM'}
              className={`w-full text-left p-5 rounded-xl border transition-all ${
                user?.subscription_plan === 'PREMIUM'
                  ? 'bg-slate-900 border-white/5 opacity-50 cursor-not-allowed'
                  : selectedPlan === 'PREMIUM' 
                  ? 'bg-accent-500/10 border-accent-500/50 ring-1 ring-accent-500/50' 
                  : 'bg-slate-900 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white text-lg">Premium Plan {user?.subscription_plan === 'PREMIUM' && '(Current)'}</span>
                <span className="text-xl font-bold text-accent-400">$15</span>
              </div>
              <p className="text-xs text-slate-400">Unlimited leads and advanced features.</p>
            </button>
          </div>

          {/* Screenshot Upload */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">2. Upload Payment Proof</h3>
            <div className="card-dark p-6 h-[220px] flex flex-col items-center justify-center border-dashed border-2 border-slate-700 hover:border-brand-500/50 transition-colors relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="text-center">
                  <CheckCircle2 className="mx-auto text-success-500 mb-2" size={32} />
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">Click to change file</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto text-slate-500 mb-3" size={32} />
                  <p className="text-sm font-medium text-white">Drop screenshot here or click to browse</p>
                  <p className="text-xs text-slate-500 mt-2">Supports JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="btn-primary w-full justify-center py-3 mt-6"
              style={{ opacity: (isUploading || !file) ? 0.5 : 1 }}
            >
              {isUploading ? 'Uploading...' : 'Submit for Verification'}
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

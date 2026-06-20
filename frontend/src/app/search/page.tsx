'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { searchApi, industriesApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Search, MapPin, Building2, Hash, Play, Loader2, Info, ChevronRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';
import Link from 'next/link';

const COUNTRIES = [
  'USA', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Spain', 'Italy', 'Netherlands', 'Pakistan', 'India',
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
  'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
];

export default function SearchPage() {
  const router = useRouter();
  const { user } = useUser();
  const maxLeads = user?.subscription_plan === 'FREE' ? 10 : 500;

  const [form, setForm] = useState({
    industry: '',
    country: 'USA',
    state: '',
    city: '',
    lead_count: user?.subscription_plan === 'FREE' ? 10 : 50,
  });
  const [industrySearch, setIndustrySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: industries } = useQuery({
    queryKey: ['industries', industrySearch],
    queryFn: () => industriesApi.getAll(industrySearch),
  });

  const mutation = useMutation({
    mutationFn: searchApi.startSearch,
    onSuccess: (data) => {
      toast.success(`Search job started! Found ${data.job_id.slice(0, 8)}...`);
      router.push(`/jobs`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to start search');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.industry.trim()) {
      toast.error('Please enter an industry');
      return;
    }
    mutation.mutate(form);
  };

  const filteredIndustries = industries?.filter(i =>
    i.name.toLowerCase().includes(industrySearch.toLowerCase())
  ).slice(0, 10) || [];

  const POPULAR = [
    'Dental Clinics', 'Law Firms', 'Roofing Companies', 'HVAC Contractors',
    'Real Estate Agencies', 'Restaurants', 'Auto Repair Shops', 'Gyms',
    'Accounting Firms', 'Cleaning Companies',
  ];

  return (
    <DashboardLayout
      title="New Search"
      subtitle="Find potential B2B clients by industry and location"
    >
      <div className="max-w-3xl mx-auto">
        {/* Info banner */}
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <Info size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-white font-medium mb-0.5">Ethical Lead Research</p>
            <p className="text-slate-400 text-xs">
              LeadForge AI only collects publicly available business information.
              No private data, no spam — research and personalized outreach only.
            </p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Industry */}
          <div className="card-dark relative z-50">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-brand-400" />
              <h3 className="text-sm font-semibold text-white">Industry</h3>
              <span className="text-red-400 text-xs">*</span>
            </div>

            <div className="relative">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={form.industry || industrySearch}
                  onChange={(e) => {
                    setIndustrySearch(e.target.value);
                    setForm({ ...form, industry: e.target.value });
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="e.g., Dental Clinics, Roofing Companies..."
                  className="input-dark pl-9"
                  required
                />
              </div>

              {showDropdown && filteredIndustries.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-slate-950 border border-white/10 shadow-2xl rounded-xl overflow-hidden">
                  {filteredIndustries.map((industry) => (
                    <button
                      key={industry.id}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, industry: industry.name });
                        setIndustrySearch(industry.name);
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="text-white">{industry.name}</span>
                      {industry.category && (
                        <span className="text-xs text-slate-500 ml-2">{industry.category}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular suggestions */}
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Popular Industries:</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => { setForm({ ...form, industry: ind }); setIndustrySearch(ind); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      form.industry === ind
                        ? 'bg-brand-600/30 border-brand-500/50 text-brand-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card-dark relative z-40">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-accent-400" />
              <h3 className="text-sm font-semibold text-white">Location</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Country *</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="input-dark"
                  required
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">State / Province</label>
                {form.country === 'USA' ? (
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="input-dark"
                  >
                    <option value="">All States</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="Optional"
                    className="input-dark"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g., New York City"
                  className="input-dark"
                />
              </div>
            </div>
          </div>

          {/* Lead Count */}
          <div className="card-dark">
            <div className="flex items-center gap-2 mb-4">
              <Hash size={16} className="text-success-400" />
              <h3 className="text-sm font-semibold text-white">Lead Count</h3>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={5} max={maxLeads} step={5}
                value={Math.min(form.lead_count, maxLeads)}
                onChange={(e) => setForm({ ...form, lead_count: Number(e.target.value) })}
                className="flex-1 h-2 rounded-full bg-white/10 accent-brand-500"
              />
              <div className="w-20">
                <input
                  type="number"
                  min={5} max={maxLeads}
                  value={Math.min(form.lead_count, maxLeads)}
                  onChange={(e) => setForm({ ...form, lead_count: Math.min(Number(e.target.value), maxLeads) })}
                  className="input-dark text-center"
                />
              </div>
            </div>
            
            {user?.subscription_plan === 'FREE' && (
              <div className="mt-4 p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Lock size={14} className="text-brand-400" />
                  Free plan is limited to 10 leads per search.
                </div>
                <Link href="/upgrade" className="text-xs font-semibold text-brand-400 hover:text-white transition-colors">
                  Upgrade Plan
                </Link>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>5 (Quick)</span>
              <span>{form.lead_count} leads</span>
              <span>500 (Full)</span>
            </div>

            {/* Estimated time */}
            <div className="mt-3 text-xs text-slate-500">
              Estimated time: ~{Math.ceil(form.lead_count * 3 / 60)} min
              ({form.lead_count} companies to discover and analyze)
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1 justify-center py-3.5 text-base"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Starting search...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start Search
                  <ChevronRight size={16} className="ml-auto" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

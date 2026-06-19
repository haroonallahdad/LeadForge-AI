'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ShieldAlert, Users, CreditCard, Check, X, Image as ImageIcon } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'USERS' | 'PAYMENTS'>('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const router = useRouter();
  const { user, isLoading: userLoading } = useUser({ redirectTo: '/login' });

  useEffect(() => {
    if (!userLoading && user && user.role !== 'admin') {
      toast.error('Admin access required');
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [activeTab, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'USERS') {
        const res = await api.get('/api/v1/admin/users');
        setUsers(res.data);
      } else {
        const res = await api.get('/api/v1/admin/payments');
        setPayments(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (id: string) => {
    try {
      await api.post(`/api/v1/admin/users/${id}/approve`);
      toast.success('User approved');
      fetchData();
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const approvePayment = async (id: string) => {
    try {
      await api.post(`/api/v1/admin/payments/${id}/approve`);
      toast.success('Payment approved and plan upgraded!');
      fetchData();
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const rejectPayment = async (id: string) => {
    try {
      await api.post(`/api/v1/admin/payments/${id}/reject`);
      toast.error('Payment rejected');
      fetchData();
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  const viewProofImage = async (id: string) => {
    try {
      const res = await api.get(`/api/v1/admin/payments/${id}/image`);
      setSelectedImage(res.data.image_base64);
    } catch (err) {
      toast.error('Failed to load image');
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Manage users and verify payments">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'USERS' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users size={18} /> Approvals & Users
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'PAYMENTS' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard size={18} /> Payment Proofs
          </button>
        </div>

        {/* Content */}
        <div className="card-dark overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading...</div>
          ) : activeTab === 'USERS' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{u.full_name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 capitalize">{u.role}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-300">
                        {u.subscription_plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="text-success-400 flex items-center gap-1.5"><Check size={14} /> Verified</span>
                      ) : (
                        <span className="text-warning-400 flex items-center gap-1.5"><ShieldAlert size={14} /> Unverified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!u.is_active && (
                        <button onClick={() => approveUser(u.id)} className="btn-primary py-1.5 px-4 text-xs">
                          Force Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">User Email</th>
                  <th className="px-6 py-4 font-semibold">Requested Plan</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white">{p.user_email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300">
                        {p.plan_requested}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{new Date(p.uploaded_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {p.status === 'PENDING' && <span className="text-warning-400 font-semibold">Pending</span>}
                      {p.status === 'APPROVED' && <span className="text-success-400 font-semibold">Approved</span>}
                      {p.status === 'REJECTED' && <span className="text-red-400 font-semibold">Rejected</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => viewProofImage(p.id)} className="text-slate-400 hover:text-white mr-4" title="View Screenshot">
                        <ImageIcon size={18} />
                      </button>
                      {p.status === 'PENDING' && (
                        <>
                          <button onClick={() => approvePayment(p.id)} className="text-success-400 hover:text-success-300 mr-3" title="Approve">
                            <Check size={18} />
                          </button>
                          <button onClick={() => rejectPayment(p.id)} className="text-red-400 hover:text-red-300" title="Reject">
                            <X size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-12 right-0 text-white hover:text-red-400">
              <X size={32} />
            </button>
            <img src={selectedImage} alt="Payment Proof" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/**
 * LeadForge AI — API Client
 * Axios instance with JWT auth, error handling, and typed methods.
 */
import axios from 'axios';
import Cookies from 'js-cookie';
import type {
  PaginatedResponse,
  LeadListItem,
  LeadDetail,
  SearchJob,
  Industry,
  Analytics,
  EmailDraft,
  LeadFilters,
} from '@/types';

const TOKEN_KEY = 'leadforge_token';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY) || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove(TOKEN_KEY);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/api/v1/auth/login', { email, password });
    const { access_token, user } = res.data;
    Cookies.set(TOKEN_KEY, access_token, { expires: 1 });
    localStorage.setItem(TOKEN_KEY, access_token);
    return { token: access_token, user };
  },

  register: async (email: string, password: string, full_name: string) => {
    const res = await api.post('/api/v1/auth/register', { email, password, full_name });
    const { access_token, user } = res.data;
    Cookies.set(TOKEN_KEY, access_token, { expires: 1 });
    localStorage.setItem(TOKEN_KEY, access_token);
    return { token: access_token, user };
  },

  me: async () => {
    const res = await api.get('/api/v1/auth/me');
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post('/api/v1/auth/forgot-password', { email });
    return res.data;
  },

  logout: () => {
    Cookies.remove(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },
  isLoggedIn: () => {
    if (typeof window !== 'undefined') {
      return !!(Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY));
    }
    return false;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Search & Jobs
// ─────────────────────────────────────────────────────────────────────────────

export const searchApi = {
  startSearch: async (data: {
    industry: string;
    country: string;
    state?: string;
    city?: string;
    lead_count: number;
  }) => {
    const res = await api.post('/api/v1/search', data);
    return res.data;
  },

  getJobs: async (params?: { skip?: number; limit?: number }) => {
    const res = await api.get('/api/v1/jobs', { params });
    return res.data as { total: number; items: SearchJob[] };
  },

  getJob: async (id: string) => {
    const res = await api.get(`/api/v1/jobs/${id}`);
    return res.data as SearchJob;
  },

  cancelJob: async (id: string) => {
    await api.delete(`/api/v1/jobs/${id}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Leads
// ─────────────────────────────────────────────────────────────────────────────

export const leadsApi = {
  getLeads: async (
    params?: LeadFilters & { skip?: number; limit?: number }
  ) => {
    const res = await api.get('/api/v1/leads', { params });
    return res.data as PaginatedResponse<LeadListItem>;
  },

  getLead: async (id: string) => {
    const res = await api.get(`/api/v1/leads/${id}`);
    return res.data as LeadDetail;
  },

  updateLead: async (id: string, data: Partial<LeadDetail>) => {
    const res = await api.put(`/api/v1/leads/${id}`, data);
    return res.data as LeadDetail;
  },

  deleteLead: async (id: string) => {
    await api.delete(`/api/v1/leads/${id}`);
  },

  addNote: async (id: string, content: string) => {
    const res = await api.post(`/api/v1/leads/${id}/notes`, { content });
    return res.data;
  },

  addHistory: async (id: string, action: string, notes?: string) => {
    const res = await api.post(`/api/v1/leads/${id}/history`, { action, notes });
    return res.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export const exportApi = {
  export: async (format: 'csv' | 'xlsx', lead_ids?: string[]) => {
    const res = await api.post(
      '/api/v1/export',
      { format, lead_ids },
      { responseType: 'blob' }
    );
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    const ext = format === 'xlsx' ? 'xlsx' : 'csv';
    link.setAttribute('download', `leadforge_export.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

export const analyticsApi = {
  get: async () => {
    const res = await api.get('/api/v1/analytics');
    return res.data as Analytics;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Industries
// ─────────────────────────────────────────────────────────────────────────────

export const industriesApi = {
  getAll: async (search?: string) => {
    const res = await api.get('/api/v1/industries', { params: { search } });
    return res.data as Industry[];
  },

  create: async (name: string, category?: string) => {
    const res = await api.post('/api/v1/industries', { name, category });
    return res.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Email Generator
// ─────────────────────────────────────────────────────────────────────────────

export const emailApi = {
  generate: async (data: {
    company_name: string;
    executive_name?: string;
    industry?: string;
    website_issues?: string[];
    recommended_services?: string[];
    tone?: string;
  }) => {
    const res = await api.post('/api/v1/email/generate', data);
    return res.data as EmailDraft;
  },
};

export default api;

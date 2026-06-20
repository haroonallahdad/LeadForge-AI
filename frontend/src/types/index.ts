/**
 * LeadForge AI — TypeScript Type Definitions
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'analyst';
  is_active: boolean;
  created_at: string;
}

export interface Industry {
  id: string;
  name: string;
  category: string | null;
  aliases: string[];
  is_custom: boolean;
}

export type LeadStatus =
  | 'new'
  | 'researching'
  | 'contacted'
  | 'follow_up'
  | 'interested'
  | 'meeting_scheduled'
  | 'proposal_sent'
  | 'closed_won'
  | 'closed_lost'
  | 'rejected';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ContactInfo {
  id: string;
  email: string | null;
  phone: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  source: string | null;
}

export interface WebsiteAnalysis {
  website_exists: boolean;
  ssl_enabled: boolean;
  mobile_responsive: boolean;
  has_contact_form: boolean;
  has_cta_button: boolean;
  has_social_links: boolean;
  has_seo_title: boolean;
  has_seo_description: boolean;
  website_score: number;
  page_title: string | null;
  meta_description: string | null;
  improvement_summary: string | null;
}

export interface Executive {
  id: string;
  name: string;
  position: string | null;
  linkedin: string | null;
}

export interface OpportunityInsight {
  ai_notes: string | null;
  manual_notes: string | null;
  recommended_services: string[];
}

export interface LeadListItem {
  id: string;
  company_name: string;
  industry: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  website: string | null;
  emails: string[];
  phones: string[];
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  rating: number | null;
  review_count: number | null;
  lead_score: number;
  website_score: number;
  status: LeadStatus;
  tags: Tag[];
  source: string | null;
  created_at: string | null;
}

export interface LeadDetail extends LeadListItem {
  address: string | null;
  description: string | null;
  source_id: string | null;
  is_duplicate: boolean;
  contact_info: ContactInfo[];
  website_analysis: WebsiteAnalysis | null;
  executives: Executive[];
  opportunity_insight: OpportunityInsight | null;
  notes: Array<{ id: string; content: string; created_at: string }>;
  contact_history: Array<{
    id: string;
    action: string;
    notes: string | null;
    timestamp: string;
  }>;
}

export interface PaginatedResponse<T> {
  total: number;
  skip: number;
  limit: number;
  items: T[];
}

export interface SearchJob {
  id: string;
  industry_name: string;
  country: string;
  state: string | null;
  city: string | null;
  lead_count: number;
  status: JobStatus;
  progress: number;
  current_step: string | null;
  total_found: number;
  total_crawled: number;
  total_scored: number;
  error_message: string | null;
  logs: Array<{ ts: string; msg: string }>;
  celery_task_id: string | null;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface Analytics {
  total_leads: number;
  avg_lead_score: number;
  contacted_leads: number;
  closed_won: number;
  total_exports: number;
  total_jobs: number;
  conversion_rate: number;
  contact_rate: number;
  top_industries: Array<{ name: string; count: number }>;
  top_cities: Array<{ name: string; count: number }>;
}

export interface EmailDraft {
  subject: string;
  body: string;
  cta: string;
  tone: string;
  recipient: string;
  recommended_services: string[];
}

export interface LeadFilters {
  search?: string;
  status?: string;
  industry?: string;
  country?: string;
  state?: string;
  city?: string;
  min_score?: number;
  max_score?: number;
  job_id?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

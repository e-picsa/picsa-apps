import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

/** Row shape returned by feedback_reports queries (all columns). */
export interface FeedbackReportRow {
  id: string;
  type: 'feedback' | 'bug_report';
  user_id: string | null;
  comment: string;
  device_info: Record<string, unknown>;
  screenshot_path: string | null;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Filters accepted by the list endpoint. */
export interface FeedbackFilters {
  id?: string;
  status?: FeedbackReportRow['status'];
  type?: FeedbackReportRow['type'];
  app_version?: string;
  os?: string;
  limit?: number;
  offset?: number;
}

/** Response from the signed-url endpoint. */
export interface FeedbackSignedUrl {
  signed_url: string;
  expires_in: number;
}

/** Status options including "All" (undefined) — used by list filters. */
export const STATUS_FILTER_OPTIONS: Array<{ value: FeedbackFilters['status']; label: string }> = [
  { value: undefined, label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

/** Type options including "All" (undefined) — used by list filters. */
export const TYPE_FILTER_OPTIONS: Array<{ value: FeedbackFilters['type']; label: string }> = [
  { value: undefined, label: 'All' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'bug_report', label: 'Bug report' },
];

/** Selectable status values only (no "All") — used by detail select. */
export const STATUS_OPTIONS: Array<{ value: Exclude<FeedbackFilters['status'], undefined>; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

/** Selectable type values only (no "All") — used by detail select. */
export const TYPE_OPTIONS: Array<{ value: Exclude<FeedbackFilters['type'], undefined>; label: string }> = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'bug_report', label: 'Bug report' },
];

@Injectable({ providedIn: 'root' })
export class FeedbackDashboardService {
  private supabaseService = inject(SupabaseService);

  /** List feedback reports with optional filters. Defaults to the latest 100 rows. */
  public async list(filters: FeedbackFilters = {}): Promise<FeedbackReportRow[]> {
    const data = await this.supabaseService.invokeFunction<FeedbackReportRow[]>('dashboard/feedback/list', {
      body: { limit: 100, offset: 0, ...filters },
    });
    return data ?? [];
  }

  /** Fetch a single report by id (uses the list endpoint's id filter). */
  public async getById(id: string): Promise<FeedbackReportRow | null> {
    const rows = await this.list({ id, limit: 1, offset: 0 });
    return rows[0] ?? null;
  }

  /** Update a feedback report's status and/or admin notes. */
  public async update(id: string, changes: { status?: FeedbackReportRow['status']; admin_notes?: string }) {
    const data = await this.supabaseService.invokeFunction<FeedbackReportRow>('dashboard/feedback/update', {
      body: { id, ...changes },
    });
    return data;
  }

  /** Get a signed URL for a feedback screenshot. */
  public async getSignedUrl(id: string): Promise<FeedbackSignedUrl> {
    const data = await this.supabaseService.invokeFunction<FeedbackSignedUrl>('dashboard/feedback/signed-url', {
      body: { id },
    });
    if (!data?.signed_url) return { signed_url: '', expires_in: 0 };
    return { ...data, signed_url: this.rewriteToPublicOrigin(data.signed_url) };
  }

  /** Signed URLs are minted inside the edge runtime (internal host); rewrite to the public Supabase origin. */
  private rewriteToPublicOrigin(signedUrl: string): string {
    try {
      const url = new URL(signedUrl);
      const base = new URL(this.supabaseService.config.apiUrl);
      url.protocol = base.protocol;
      url.host = base.host;
      return url.toString();
    } catch {
      return signedUrl;
    }
  }
}

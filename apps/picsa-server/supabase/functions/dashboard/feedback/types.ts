import { z } from 'npm:zod@4/v4';

// ---------------------------------------------------------------------------
// Request validation schemas
// ---------------------------------------------------------------------------

/** List endpoint filters */
export const listFeedbackSchema = z.object({
  status: z.enum(['open', 'in_review', 'resolved', 'closed']).optional(),
  type: z.enum(['feedback', 'bug_report']).optional(),
  app_version: z.string().max(64).optional(),
  os: z.string().max(64).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListFeedbackInput = z.infer<typeof listFeedbackSchema>;

/** Update endpoint body */
export const updateFeedbackSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(['open', 'in_review', 'resolved', 'closed']).optional(),
    admin_notes: z.string().max(2000).optional(),
  })
  .refine((data) => data.status !== undefined || data.admin_notes !== undefined, {
    message: 'At least one of status or admin_notes must be provided',
  });

export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;

/** Signed-URL endpoint body */
export const signedUrlSchema = z.object({
  id: z.uuid(),
});

export type SignedUrlInput = z.infer<typeof signedUrlSchema>;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

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

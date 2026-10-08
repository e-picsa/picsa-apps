import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../models';

export interface IFeedbackQueueEntry {
  id: string;
  type: 'feedback' | 'bug_report';
  comment: string;
  device_info: Record<string, string | undefined>;
  screenshot_base64?: string;
  screenshot_type?: 'image/png' | 'image/jpeg' | 'image/webp';
  screen_path?: string;
  status: 'pending' | 'submitting' | 'submitted' | 'failed';
  retry_count: number;
  last_attempt_at?: string;
  server_id?: string;
  screenshot_path?: string;
  created_at: string;
}

export const SCHEMA_V0: RxJsonSchema<IFeedbackQueueEntry> = {
  title: 'feedback_queue',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    id: { type: 'string' },
    type: { type: 'string' },
    comment: { type: 'string' },
    device_info: { type: 'object', additionalProperties: { type: 'string' } },
    screenshot_base64: { type: 'string' },
    screenshot_type: { type: 'string' },
    screen_path: { type: 'string' },
    status: { type: 'string', default: 'pending' },
    retry_count: { type: 'integer', default: 0 },
    last_attempt_at: { type: 'string' },
    server_id: { type: 'string' },
    screenshot_path: { type: 'string' },
    created_at: { type: 'string' },
  },
  primaryKey: 'id',
  required: ['id', 'type', 'comment', 'device_info', 'status', 'retry_count', 'created_at'],
};

export const FEEDBACK_QUEUE_COLLECTION: IPicsaCollectionCreator<IFeedbackQueueEntry> = {
  schema: SCHEMA_V0,
  isUserCollection: true,
  syncPush: false,
};

import { inject, Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import type { RxCollection, RxDocument } from 'rxdb';

import { PicsaAsyncService } from '../../asyncService.service';
import { PicsaDatabase_V2_Service } from '../db_v2';
import { FEEDBACK_QUEUE_COLLECTION, IFeedbackQueueEntry } from '../db_v2/schemas/feedback_queue';
import { NetworkService } from '../network.service';
import { SupabaseService } from '../supabase';
import { DeviceInfoService } from './device-info.service';

interface IFeedbackSubmission {
  type: 'feedback' | 'bug_report';
  comment: string;
  screenshot_base64?: string;
  screenshot_type?: string;
  screen_path?: string;
}

interface IFeedbackResponse {
  id: string;
  screenshot_path: string | null;
}

const BACKOFF_BASE = 30_000;
const BACKOFF_CAP = 3_600_000;

@Injectable({ providedIn: 'root' })
export class FeedbackService extends PicsaAsyncService {
  private readonly dbService = inject(PicsaDatabase_V2_Service);
  private readonly networkService = inject(NetworkService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly deviceInfoService = inject(DeviceInfoService);

  private collection: RxCollection<IFeedbackQueueEntry>;

  private draining = false;
  private networkListener: { remove: () => Promise<void> } | undefined;
  private retryTimer: ReturnType<typeof setInterval> | undefined;

  public override async init() {
    await this.dbService.ready();
    await this.dbService.ensureCollections({ feedback_queue: FEEDBACK_QUEUE_COLLECTION });
    this.collection = this.dbService.db.collections['feedback_queue'] as RxCollection<IFeedbackQueueEntry>;

    // Reset any docs stranded as 'submitting' from a previous crash (not retried by drain())
    const strandedDocs = await this.collection.find({ selector: { status: 'submitting' } }).exec();
    for (const doc of strandedDocs) {
      await this.updateDoc(doc, { status: 'pending' });
    }

    this.networkListener = await Network.addListener('networkStatusChange', (status) => {
      if (status.connected && status.connectionType !== 'none') {
        // drain() may rethrow server errors; background path must not crash
        this.drain().catch(noop);
      }
    });
    this.retryTimer = setInterval(() => this.drain().catch(noop), 30_000);
    await this.drain().catch(noop);
  }

  /** Queue a new feedback entry and attempt to drain immediately if online */
  async submit(input: IFeedbackSubmission): Promise<'submitted' | 'pending' | 'failed'> {
    await this.ready();
    // Avoid duplicate queue entries when submit is triggered repeatedly (e.g. offline double-tap)
    const duplicate = await this.findUnsentDuplicate(input);
    if (duplicate) return 'pending';
    const device_info = await this.deviceInfoService.collect();
    const entry: IFeedbackQueueEntry = {
      id: crypto.randomUUID(),
      type: input.type,
      comment: input.comment,
      device_info,
      screenshot_base64: input.screenshot_base64,
      screenshot_type: input.screenshot_type as IFeedbackQueueEntry['screenshot_type'],
      screen_path: input.screen_path,
      status: 'pending',
      retry_count: 0,
      created_at: new Date().toISOString(),
    };
    await this.collection.insert(entry);
    if (!this.networkService.isOnline()) {
      return 'pending';
    }
    await this.drain();
    const doc = await this.collection.findOne({ selector: { id: entry.id } }).exec();
    if (!doc) return 'failed';
    const status = doc._data.status as IFeedbackQueueEntry['status'];
    return status === 'submitted' ? 'submitted' : 'failed';
  }

  /** Process all pending/failed feedback entries, respecting exponential backoff */
  async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      const docs = await this.collection
        .find({
          selector: { status: { $in: ['pending', 'failed'] } },
        })
        .exec();
      for (const doc of docs) {
        const data = doc._data;
        if (!this.shouldAttempt(data)) {
          continue;
        }
        await this.updateDoc(doc, { status: 'submitting' });
        try {
          const response = await this.pushToServer(data);
          await this.updateDoc(doc, {
            status: 'submitted',
            server_id: response.id,
            screenshot_path: response.screenshot_path ?? undefined,
            last_attempt_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error('[Feedback] submit failed', error);
          await this.updateDoc(doc, {
            status: 'failed',
            retry_count: data.retry_count + 1,
            last_attempt_at: new Date().toISOString(),
          });
          // Surface server (non-network) errors to the caller (e.g. the dialog)
          // instead of silently queuing a retry that will keep failing.
          if ((error as any)?.__picsaServerError) {
            throw error;
          }
        }
      }
    } finally {
      this.draining = false;
    }
  }

  private async updateDoc(doc: RxDocument<IFeedbackQueueEntry>, changes: Partial<IFeedbackQueueEntry>) {
    Object.assign(doc._data, changes);
    await this.collection.bulkUpsert([doc._data]);
  }

  private shouldAttempt(data: IFeedbackQueueEntry): boolean {
    if (data.status === 'pending') return true;
    if (!data.last_attempt_at) return true;
    const elapsed = Date.now() - new Date(data.last_attempt_at).getTime();
    const backoff = Math.min(BACKOFF_BASE * 2 ** data.retry_count, BACKOFF_CAP);
    return elapsed >= backoff;
  }

  private async pushToServer(data: IFeedbackQueueEntry): Promise<IFeedbackResponse> {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('comment', data.comment);
    formData.append('device_info', JSON.stringify(data.device_info));
    if (data.screen_path) formData.append('screen_path', data.screen_path);
    if (data.screenshot_base64 && data.screenshot_type) {
      formData.append('screenshot', base64ToBlob(data.screenshot_base64, data.screenshot_type), 'screenshot.png');
    }
    await this.supabaseService.ready();
    try {
      const response = await this.supabaseService.invokeFunction<IFeedbackResponse>('feedback', { body: formData });
      if (!response) {
        throw new Error('[Feedback] Supabase function not available');
      }
      return response;
    } catch (err) {
      // Network / connectivity failures keep the generic offline/retry path.
      if (this.isNetworkFailure(err)) {
        throw err;
      }
      // A real server response: surface the server's own message to the user.
      // handleFunctionsError already extracted it (via error.context.json()); it
      // stringifies bare string payloads, so unwrap one level of quotes here.
      const serverMessage = this.extractServerMessage(err);
      const serverErr = new Error(serverMessage);
      (serverErr as any).__picsaServerError = true;
      throw serverErr;
    }
  }

  /** True for connectivity failures that should stay on the generic retry path. */
  private isNetworkFailure(err: unknown): boolean {
    if ((err as { __picsaNetworkError?: boolean })?.__picsaNetworkError === true) return true;
    if (this.networkService.isNetworkError(err)) return true;
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    return (
      msg.includes('not running locally') || msg.includes('endpoint is not running') || msg.includes('not available')
    );
  }

  /**
   * Pull the server's message out of an error thrown by invokeFunction.
   * handleFunctionsError stringifies bare string payloads, wrapping them in quotes;
   * unwrap one level so the user sees the real text.
   */
  private extractServerMessage(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.startsWith('"') && raw.endsWith('"')) {
      try {
        const unwrapped = JSON.parse(raw);
        if (typeof unwrapped === 'string') return unwrapped;
      } catch {
        // not a quoted string after all; fall through
      }
    }
    return raw;
  }

  /** True when an identical submission is already queued and not yet sent. */
  private async findUnsentDuplicate(input: IFeedbackSubmission): Promise<boolean> {
    const docs = await this.collection.find({ selector: { status: { $in: ['pending', 'submitting'] } } }).exec();
    return docs.some(({ _data: d }) => {
      return (
        d.type === input.type &&
        d.comment === input.comment &&
        d.screen_path === input.screen_path &&
        d.screenshot_base64 === input.screenshot_base64
      );
    });
  }
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.codePointAt(i) ?? 0;
  }
  return new Blob([bytes], { type: mime });
}

/** Swallows a rejected promise's error in branches where it's already handled. */
const noop = () => undefined;

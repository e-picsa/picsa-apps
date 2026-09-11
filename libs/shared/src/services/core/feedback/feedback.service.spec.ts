import { TestBed } from '@angular/core/testing';
import type { RxCollection } from 'rxdb';

import { PicsaDatabase_V2_Service } from '../db_v2';
import { NetworkService } from '../network.service';
import { SupabaseService } from '../supabase';
import { DeviceInfoService } from './device-info.service';
import { FeedbackService } from './feedback.service';

jest.mock('@capacitor/network', () => ({
  Network: {
    addListener: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  },
}));

interface IDoc {
  id: string;
  type: string;
  comment: string;
  device_info: Record<string, string>;
  status: string;
  retry_count: number;
  created_at: string;
  last_attempt_at?: string;
  server_id?: string;
}

function createMockCollection() {
  const docs: any[] = [];
  const collection = {
    insert: jest.fn(async (entry: IDoc) => {
      const doc = { _data: { ...entry } };
      docs.push(doc);
      return doc;
    }),
    bulkUpsert: jest.fn(async (items: IDoc[]) => {
      for (const item of items) {
        const existing = docs.find((d) => d._data.id === item.id);
        if (existing) existing._data = { ...item };
      }
      return items;
    }),
    find: jest.fn(() => {
      const queryResult = {
        exec: jest.fn(async () => {
          const allFindCalls = (collection.find as jest.Mock).mock.calls;
          const selector = allFindCalls[allFindCalls.length - 1]?.[0]?.selector || {};
          const statusFilter = selector.status;
          return docs.filter((d) => {
            if (!statusFilter) return true;
            if (statusFilter.$in) return statusFilter.$in.includes(d._data.status);
            return d._data.status === statusFilter;
          });
        }),
        $: { subscribe: jest.fn() },
      };
      return queryResult;
    }),
    findOne: jest.fn((query: any) => {
      const selector = query?.selector || {};
      return {
        exec: jest.fn(async () => {
          return (
            docs.find((d) => {
              for (const [key, val] of Object.entries(selector)) {
                if (d._data[key] !== val) return false;
              }
              return true;
            }) || null
          );
        }),
      };
    }),
  };
  return { collection: collection as unknown as RxCollection<any>, docs };
}

const { collection: mockCollection, docs: mockDocs } = createMockCollection();

const stubDbService = {
  ready: jest.fn(async () => Promise.resolve()),
  ensureCollections: jest.fn(async () => Promise.resolve()),
  db: { collections: { feedback_queue: mockCollection } },
};

const stubNetworkService = {
  isOnline: jest.fn().mockReturnValue(true),
  isNetworkError: jest.fn(
    (err: any) => ['fetch', 'network'].some((m) => err?.message?.includes(m)) || err?.name === 'AbortError',
  ),
};

const stubSupabaseService = {
  ready: jest.fn(async () => undefined),
  invokeFunction: jest.fn(),
};

const stubDeviceInfoService = {
  collect: jest.fn().mockResolvedValue({
    app_version: 'test',
    screen_size: '1024x768',
    network_status: 'online',
    locale: 'en',
    os: 'web',
    os_version: 'test-agent',
  }),
};

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocs.length = 0;
    stubNetworkService.isOnline.mockReturnValue(true);
    TestBed.configureTestingModule({
      providers: [
        FeedbackService,
        { provide: PicsaDatabase_V2_Service, useValue: stubDbService },
        { provide: NetworkService, useValue: stubNetworkService },
        { provide: SupabaseService, useValue: stubSupabaseService },
        { provide: DeviceInfoService, useValue: stubDeviceInfoService },
      ],
    });
    service = TestBed.inject(FeedbackService);
    // init collection without running full init (which calls network listener)
    service['collection'] = mockCollection as any;
  });

  afterEach(() => {
    clearInterval(service['retryTimer']);
  });

  it('queues a pending doc when offline and does not call server', async () => {
    stubNetworkService.isOnline.mockReturnValue(false);
    const result = await service.submit({ type: 'feedback', comment: 'hello' });
    expect(mockCollection.insert).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'hello', status: 'pending', retry_count: 0 }),
    );
    expect(stubSupabaseService.invokeFunction).not.toHaveBeenCalled();
    expect(result).toBe('pending');
  });

  it('drains a pending doc online, posting FormData with expected fields', async () => {
    stubSupabaseService.invokeFunction.mockResolvedValue({ id: 'srv-1', screenshot_path: null });
    const result = await service.submit({ type: 'bug_report', comment: 'bug' });

    expect(stubSupabaseService.invokeFunction).toHaveBeenCalledTimes(1);
    const [endpoint, options] = stubSupabaseService.invokeFunction.mock.calls[0];
    expect(endpoint).toBe('feedback');
    const formData = options.body as FormData;
    expect(formData.get('type')).toBe('bug_report');
    expect(formData.get('comment')).toBe('bug');
    expect(JSON.parse(formData.get('device_info') as string)).toHaveProperty('app_version');
    expect(result).toBe('submitted');
  });

  it('marks doc failed with retry_count+1 when server call throws', async () => {
    stubSupabaseService.invokeFunction.mockRejectedValueOnce(new Error('network'));
    const result = await service.submit({ type: 'feedback', comment: 'fail-me' });
    const target = mockDocs.find((d) => d._data.comment === 'fail-me');
    expect(target._data.status).toBe('failed');
    expect(target._data.retry_count).toBe(1);
    expect(result).toBe('failed');
  });

  it('resets stranded "submitting" docs to "pending" on init', async () => {
    // Seed a doc that would be stuck in 'submitting' after a mid-upload crash
    mockDocs.push({
      _data: {
        id: 'stranded',
        type: 'feedback',
        comment: 'stranded-doc',
        device_info: {},
        status: 'submitting',
        retry_count: 1,
        created_at: new Date().toISOString(),
      },
    });
    stubSupabaseService.invokeFunction.mockResolvedValue({ id: 'srv-3', screenshot_path: null });
    await service.init();
    // init resets 'submitting' → 'pending', then drain() processes it → 'submitted'
    const doc = mockDocs.find((d) => d._data.id === 'stranded');
    expect(doc._data.status).not.toBe('submitting');
    expect(doc._data.status).toBe('submitted');
    expect(stubSupabaseService.invokeFunction).toHaveBeenCalledTimes(1);
  });

  it('skips backoff-locked failed docs during drain', async () => {
    const recent = new Date(Date.now() - 1000).toISOString();
    mockDocs.push({
      _data: {
        id: 'locked',
        type: 'feedback',
        comment: 'locked',
        device_info: {},
        status: 'failed',
        retry_count: 3,
        created_at: recent,
        last_attempt_at: recent,
      },
    });
    stubSupabaseService.invokeFunction.mockResolvedValue({ id: 'srv-2', screenshot_path: null });
    await service.drain();
    expect(stubSupabaseService.invokeFunction).not.toHaveBeenCalled();
  });

  it('does not rethrow __picsaNetworkError as server error and returns failed for retry', async () => {
    const networkErr = Object.assign(new Error('Failed to send a request to the Edge Function'), {
      __picsaNetworkError: true,
    });
    stubSupabaseService.invokeFunction.mockRejectedValueOnce(networkErr);
    const result = await service.submit({ type: 'feedback', comment: 'net-fail' });
    const target = mockDocs.find((d) => d._data.comment === 'net-fail');
    expect(target._data.status).toBe('failed');
    expect(target._data.retry_count).toBe(1);
    expect(result).toBe('failed');
  });

  it('rejects duplicate unsent submissions (same content while still queued)', async () => {
    stubNetworkService.isOnline.mockReturnValue(false);
    const input = { type: 'feedback' as const, comment: 'duplicate-test' };
    const first = await service.submit(input);
    expect(first).toBe('pending');
    expect(mockCollection.insert).toHaveBeenCalledTimes(1);
    // Second identical submit while still pending should return 'pending' without inserting
    const second = await service.submit(input);
    expect(second).toBe('pending');
    expect(mockCollection.insert).toHaveBeenCalledTimes(1);
  });
});

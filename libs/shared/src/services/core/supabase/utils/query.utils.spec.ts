import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Database } from '@picsa/server-types';
import { SupabaseClient } from '@supabase/supabase-js';

import { tableWithLive } from './query.utils';

describe('query.utils', () => {
  let mockSupabaseClient: jest.Mocked<SupabaseClient<Database>>;
  let mockChannel: any;
  let mockQueryBuilder: any;
  let injector: Injector;

  beforeEach(() => {
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };

    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve({ data: [{ id: '1', status: 'pending' }], error: null })),
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnValue(mockQueryBuilder),
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [Injector],
    });
    injector = TestBed.inject(Injector);
  });

  describe('liveQuery$ caching', () => {
    it('returns the same cached Observable instance for identical query parameters while subscribed', () => {
      const table = tableWithLive(injector, mockSupabaseClient, 'deployment_access_requests');

      const query1$ = table.liveQuery$({ filter: { status: 'pending' } });
      const query2$ = table.liveQuery$({ filter: { status: 'pending' } });

      const sub1 = query1$.subscribe();
      const query3$ = table.liveQuery$({ filter: { status: 'pending' } });

      expect(query1$).toBe(query3$);
      expect(query2$).toBe(query3$);

      sub1.unsubscribe();
    });

    it('serializes array/object filter values with JSON.stringify to avoid [object Object] collisions', () => {
      const table = tableWithLive(injector, mockSupabaseClient, 'deployment_access_requests');

      const queryA$ = table.liveQuery$({ filter: { status: { eq: 'pending' } as any } });
      const queryB$ = table.liveQuery$({ filter: { status: { eq: 'approved' } as any } });

      const subA = queryA$.subscribe();

      expect(queryA$).not.toBe(queryB$);

      subA.unsubscribe();
    });

    it('evicts the cache key when all subscribers unsubscribe', () => {
      const table = tableWithLive(injector, mockSupabaseClient, 'deployment_access_requests');

      const query1$ = table.liveQuery$({ filter: { status: 'pending' } });
      const sub1 = query1$.subscribe();

      // Active subscription keeps query in cache
      expect(table.liveQuery$({ filter: { status: 'pending' } })).toBe(query1$);

      sub1.unsubscribe();

      // After refCount drops to 0, cache key is evicted
      const query2$ = table.liveQuery$({ filter: { status: 'pending' } });
      expect(query2$).not.toBe(query1$);
    });

    it('does not evict a new active cache entry when an old instance finalizes later', () => {
      const table = tableWithLive(injector, mockSupabaseClient, 'deployment_access_requests');

      // Create query1$ and subscribe
      const query1$ = table.liveQuery$({ filter: { status: 'pending' } });
      const sub1 = query1$.subscribe();

      // Unsubscribe query1$ -> evicts query1$ from cache
      sub1.unsubscribe();

      // Create query2$ and subscribe -> stores query2$ in cache
      const query2$ = table.liveQuery$({ filter: { status: 'pending' } });
      const sub2 = query2$.subscribe();

      // Re-subscribe to query1$ and unsubscribe it again (simulating retained instance teardown)
      const sub1Again = query1$.subscribe();
      sub1Again.unsubscribe();

      // The cache should STILL hold query2$ because query1$'s finalize ignored the eviction
      expect(table.liveQuery$({ filter: { status: 'pending' } })).toBe(query2$);

      sub2.unsubscribe();
    });

    it('isolates query caches per SupabaseClient instance', () => {
      const secondMockClient: jest.Mocked<SupabaseClient<Database>> = {
        from: jest.fn().mockReturnValue({ ...mockQueryBuilder }),
        channel: jest.fn().mockReturnValue(mockChannel),
        removeChannel: jest.fn(),
      } as any;

      const table1 = tableWithLive(injector, mockSupabaseClient, 'deployment_access_requests');
      const table2 = tableWithLive(injector, secondMockClient, 'deployment_access_requests');

      const query1$ = table1.liveQuery$({ filter: { status: 'pending' } });
      const query2$ = table2.liveQuery$({ filter: { status: 'pending' } });

      const sub1 = query1$.subscribe();

      expect(query1$).not.toBe(query2$);

      sub1.unsubscribe();
    });
  });
});

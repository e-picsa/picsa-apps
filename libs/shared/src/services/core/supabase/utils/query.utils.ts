import { effect, Injector, isSignal, runInInjectionContext, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Database } from '@picsa/server-types';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  defer,
  distinctUntilChanged,
  finalize,
  map,
  merge,
  Observable,
  scan,
  shareReplay,
  Subject,
  switchMap,
} from 'rxjs';

/* --- types --- */

type Change<T> = { type: 'init'; rows: T[] } | { type: 'insert' | 'update' | 'delete'; new?: T; old?: T };

export type LiveQueryOpts<T> = {
  filter?: Partial<Record<keyof T & string, string | number | boolean>>;
  orderBy?: { column: keyof T & string; ascending?: boolean };
  primaryKey?: keyof T & string;
  select?: string;
  schema?: string;
};

type Tables = Database['public']['Tables'];
type TableRow<T extends keyof Tables> = Tables[T]['Row'];
type MaybeSignal<T> = T | Signal<T>;

/* --- caching: share live queries per SupabaseClient instance --- */
const clientQueryCaches = new WeakMap<SupabaseClient<any>, Map<string, Observable<any>>>();

function getClientLiveQueryCache(client: SupabaseClient<any>): Map<string, Observable<any>> {
  let cache = clientQueryCaches.get(client);
  if (!cache) {
    cache = new Map<string, Observable<any>>();
    clientQueryCaches.set(client, cache);
  }
  return cache;
}

/** Generate a deterministic cache key for query options. Use JSON.stringify to avoid object/array `[object Object]` collisions. */
function getLiveQueryCacheKey(tableName: string, opts: LiveQueryOpts<any>): string {
  const filterStr = opts.filter
    ? Object.entries(opts.filter)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join('&')
    : '';
  const orderByStr = opts.orderBy ? `${String(opts.orderBy.column)}:${opts.orderBy.ascending ?? true}` : '';
  return [tableName, filterStr, opts.select ?? '*', opts.schema ?? 'public', opts.primaryKey ?? 'id', orderByStr].join(
    '|',
  );
}

/* --- core: Observable-based live query --- */

function liveQuery$<T extends Record<string, any>>(
  supabase: SupabaseClient<Database>,
  tableName: keyof Database['public']['Tables'],
  opts: LiveQueryOpts<T> = {},
): Observable<T[]> {
  const liveQueryCache = getClientLiveQueryCache(supabase as SupabaseClient<any>);
  const cacheKey = getLiveQueryCacheKey(tableName as string, opts);

  // Return active shared observable if a query with identical parameters is already in flight for this client
  if (liveQueryCache.has(cacheKey)) {
    return liveQueryCache.get(cacheKey)!;
  }

  const { filter = {}, orderBy, primaryKey = 'id' as keyof T & string, select, schema = 'public' } = opts;

  const init$ = defer(async () => {
    let q = supabase.from(tableName).select(select ?? '*');
    for (const [k, v] of Object.entries(filter)) if (v !== undefined) q = q.eq(k, v as any);
    if (orderBy) q = q.order(orderBy.column as string, { ascending: orderBy.ascending ?? true });

    const { data, error } = await q;
    if (error) throw error;
    const rows = (Array.isArray(data) ? data : []) as unknown as T[];
    return { type: 'init', rows } as const;
  });

  const changes$ = new Observable<Change<T>>((subscriber) => {
    const filterString = Object.entries(filter)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=eq.${v}`)
      .join(',');
    const ch = supabase
      .channel(`rt-${tableName}-${filterString || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema,
          table: tableName,
          ...(filterString ? { filter: filterString } : {}),
        },
        (p) => {
          const type = p.eventType.toLowerCase() as 'insert' | 'update' | 'delete';
          subscriber.next({ type, new: p.new as T, old: p.old as T });
        },
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  });

  const query$ = merge(init$, changes$).pipe(
    scan<Change<T>, T[]>((state, ev) => {
      if (ev.type === 'init') return ev.rows;
      if (ev.type === 'insert') return ev.new ? [ev.new, ...state] : state;
      if (ev.type === 'update')
        return ev.old && ev.new
          ? state.map((r) => ((r as any)[primaryKey as string] === (ev.old as any)[primaryKey as string] ? ev.new! : r))
          : state;
      if (ev.type === 'delete')
        return ev.old
          ? state.filter((r) => (r as any)[primaryKey as string] !== (ev.old as any)[primaryKey as string])
          : state;
      return state;
    }, []),
    // Evict cache key when refCount drops to 0, but only if the cache entry still points to this instance
    finalize(() => {
      if (liveQueryCache.get(cacheKey) === query$) {
        liveQueryCache.delete(cacheKey);
      }
    }),
    // Multicast with refCount: true to teardown realtime channel when all subscribers disconnect
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  liveQueryCache.set(cacheKey, query$);
  return query$;
}

/* --- table wrapper: adds liveQuery$ and liveSignal with MaybeSignals --- */

export type TableWithLive<T extends keyof Tables> = ReturnType<typeof tableWithLive<T>>;

export function tableWithLive<T extends keyof Tables>(injector: Injector, client: SupabaseClient<Database>, table: T) {
  const builder = client.from(table);

  function toPlain<U>(v: MaybeSignal<U> | undefined): U | undefined {
    if (v === undefined) return undefined;
    return isSignal(v) ? (v as Signal<U>)() : (v as U);
  }

  const api = {
    liveQuery$: (opts?: {
      filter?: Partial<Record<keyof TableRow<T> & string, any>>;
      orderBy?: { column: keyof TableRow<T> & string; ascending?: boolean };
      primaryKey?: keyof TableRow<T> & string;
      select?: string;
      schema?: string;
    }) => liveQuery$<TableRow<T>>(client, table, opts),

    /**
     * Bind a signal to a live DB query. This query will fetch all data on first load and stream updates
     *
     * IMPORTANT
     * 1. It requires enabling table publication and replica identry, @example
     * ```sql
     * alter publication supabase_realtime add table forecasts;
     * alter table forecasts replica identity full;
     * ```
     * https://supabase.com/docs/guides/realtime/postgres-changes#quick-start
     *
     * 2. It is not very efficient, and should only be used in cases where data changes are infrequent
     * and number of subscribers limited (e.g. dashboard uploaded forecasts)
     * https://supabase.com/docs/guides/realtime/postgres-changes#database-instance-and-realtime-performance
     */
    liveSignal: (opts?: {
      filter?: Partial<Record<keyof TableRow<T> & string, MaybeSignal<string | number | boolean | undefined>>>;
      orderBy?: { column: keyof TableRow<T> & string; ascending?: MaybeSignal<boolean | undefined> };
      primaryKey?: MaybeSignal<(keyof TableRow<T> & string) | undefined>;
      select?: MaybeSignal<string | undefined>;
      schema?: MaybeSignal<string | undefined>;
    }) => {
      // Subject of concrete (non-signal) params
      const params$ = new Subject<Required<LiveQueryOpts<TableRow<T>>> & { schema: string }>();

      // Bridge Angular signals to params$ using an Angular effect
      runInInjectionContext(injector, () =>
        effect(() => {
          const plainFilter = Object.fromEntries(
            Object.entries(opts?.filter ?? {}).map(([k, v]) => [k, toPlain(v as any)]),
          ) as Record<string, string | number | boolean | undefined>;

          const cleanedFilter = Object.fromEntries(
            Object.entries(plainFilter).filter(([, v]) => v !== undefined),
          ) as Record<string, string | number | boolean>;

          const orderBy =
            opts?.orderBy &&
            ({
              column: opts.orderBy.column,
              ascending: toPlain(opts.orderBy.ascending) ?? true,
            } as const);

          const primaryKey = toPlain(opts?.primaryKey) as any;
          const select = toPlain(opts?.select);
          const schema = toPlain(opts?.schema) ?? 'public';

          params$.next({
            filter: cleanedFilter as any,
            orderBy: orderBy as any,
            primaryKey: primaryKey as any,
            select: select as any,
            schema,
          });
        }),
      );

      const rows$ = params$.pipe(
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        map((p) => ({
          opts: {
            filter: p.filter,
            orderBy: p.orderBy,
            primaryKey: p.primaryKey,
            select: p.select,
            schema: p.schema,
          } satisfies LiveQueryOpts<TableRow<T>>,
        })),
        switchMap(({ opts }) => api.liveQuery$(opts)),
      );

      // Subscribe once, outside reactive contexts (but inside an injection context)
      return runInInjectionContext(injector, () => toSignal(rows$, { initialValue: [] as TableRow<T>[] }));
    },
  };

  return Object.assign(builder, api);
}

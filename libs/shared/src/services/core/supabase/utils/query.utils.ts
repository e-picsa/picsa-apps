import { Injector } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Database } from '@picsa/server-types';
import { SupabaseClient } from '@supabase/supabase-js';
import { defer, merge, Observable, scan, shareReplay } from 'rxjs';

type Change<T> = { type: 'init'; rows: T[] } | { type: 'insert' | 'update' | 'delete'; new?: T; old?: T };

type LiveQueryOpts<T> = {
  filter?: Partial<Record<keyof T & string, string | number | boolean>>;
  orderBy?: { column: keyof T & string; ascending?: boolean };
  primaryKey?: keyof T & string;
  select?: string;
  schema?: string;
};

function liveQuerySignal<T extends Record<string, any>>(
  injector: Injector,
  supabase: SupabaseClient,
  tableName: string,
  opts: LiveQueryOpts<T> = {},
) {
  const {
    filter = {},
    orderBy,
    primaryKey = 'id' as keyof T & string,
    // optional extensions, ignored below unless you also wire them
    select,
    schema = 'public',
  } = opts;

  const init$ = defer(async () => {
    let q = supabase.from(tableName).select(select ?? '*');
    for (const [k, v] of Object.entries(filter)) if (v !== undefined) q = q.eq(k, v as any);
    if (orderBy) q = q.order(orderBy.column as string, { ascending: orderBy.ascending ?? true });

    const { data, error } = await q;
    if (error) throw error;

    // Ensure array shape and coerce through unknown
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
        'postgres_changes' as any,
        {
          event: '*',
          schema,
          table: tableName, // <- key must be "table"
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

  const stream$ = merge(init$, changes$).pipe(
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
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  return toSignal(stream$, { initialValue: [] as T[], injector });
}
type Tables = Database['public']['Tables'];
type TableRow<T extends keyof Tables> = Tables[T]['Row'];

/**
 * Extend supabase table definition to include custom `signalQuery` property
 * that can be used to provide realtime updates for a table within a signal
 */
export function tableWithSignal<T extends keyof Tables>(
  injector: Injector,
  client: SupabaseClient<Database>,
  table: T,
) {
  const builder = client.from(table); // typed for T
  return Object.assign(builder, {
    signalQuery: (opts?: {
      filter?: Partial<Record<keyof TableRow<T>, any>>;
      orderBy?: { column: keyof TableRow<T> & string; ascending?: boolean };
      primaryKey?: keyof TableRow<T> & string;
      select?: string;
      schema?: string;
    }) => liveQuerySignal<TableRow<T>>(injector, client, table, opts),
  });
}
export type TableWithSignal<T extends keyof Tables> = ReturnType<typeof tableWithSignal<T>>;

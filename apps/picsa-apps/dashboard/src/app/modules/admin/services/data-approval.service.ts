import { Injectable } from '@angular/core';
import { SupabaseService } from '@picsa/shared/services/core/supabase/supabase.service';
import { BehaviorSubject, forkJoin, from, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

export interface IPendingChange {
  id: string;
  table: string;
  updated_at: string;
  published_at: string | null;
  data: any; // The record data
}

export const SYNCABLE_TABLES = [
  'climate_station_data',
  'climate_stations',
  'crop_data',
  'crop_data_downscaled',
  'deployments',
  'forecasts',
  'monitoring_forms',
  'resource_collections',
  'resource_files',
  'resource_files_child',
  'resource_links',
  'translations',
];

@Injectable({ providedIn: 'root' })
export class DataApprovalService {
  private _pendingChanges$ = new BehaviorSubject<IPendingChange[]>([]);
  public pendingChanges$ = this._pendingChanges$.asObservable();

  constructor(private supabase: SupabaseService) {}

  /**
   * Fetch all records where updated_at > published_at (or published_at is null)
   */
  public fetchPendingChanges(): Observable<IPendingChange[]> {
    return from(this.supabase.ready()).pipe(
      switchMap(() => {
        const queries = SYNCABLE_TABLES.map((table) =>
          from(
            this.supabase.db
              .table(table as any)
              .select('*')
              .or('published_at.is.null,updated_at.gt.published_at'),
          ).pipe(
            map(({ data, error }) => {
              if (error) {
                console.error(`Error fetching pending changes for ${table}:`, error);
                return [];
              }
              return (data || []).map((record: any) => ({
                id: record.id || record.station_id, // Handle different PKs
                table,
                updated_at: record.updated_at,
                published_at: record.published_at,
                data: record,
              }));
            }),
          ),
        );
        return forkJoin(queries);
      }),
      map((results) => results.flat()),
      tap((changes) => this._pendingChanges$.next(changes)),
    );
  }

  /**
   * Publish selected changes by setting published_at = NOW()
   */
  public publishChanges(changes: IPendingChange[]): Observable<void> {
    const now = new Date().toISOString();
    const updatesByTable = changes.reduce(
      (acc, change) => {
        if (!acc[change.table]) {
          acc[change.table] = [];
        }
        acc[change.table].push(change.id);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    const updateOps = Object.entries(updatesByTable).map(([table, ids]) => {
      // Determine PK column
      const pk = table.startsWith('climate_station') ? 'station_id' : 'id';

      return from(
        this.supabase.db
          .table(table as any)
          .update({ published_at: now } as any)
          .in(pk, ids),
      );
    });

    return forkJoin(updateOps).pipe(
      map(() => void 0),
      tap(() => this.fetchPendingChanges().subscribe()), // Refresh list
    );
  }
}

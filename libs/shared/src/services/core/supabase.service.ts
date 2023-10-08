import { Injectable } from '@angular/core';
import { StorageClient } from '@supabase/storage-js';
import { createClient, RealtimeClient, SupabaseClient } from '@supabase/supabase-js';

import { PicsaAsyncService } from '../asyncService.service';

/** Key safe to use in browser (assuming tables have row-level security) */
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcmZybXBvZHVibmJ1aGNsY2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQ3NTM2ODIsImV4cCI6MjAwMDMyOTY4Mn0.bNZcTIB-LqzcubgEy0_azbw7chMtCp-w4Ss9plTeuKY';

@Injectable({ providedIn: 'root' })
export class SupabaseService extends PicsaAsyncService {
  private supabase = createClient('https://earfrmpodubnbuhclccx.supabase.co', anonKey);
  public storage: StorageClient;
  public realtime: RealtimeClient;

  public db: { table: SupabaseClient['from'] };

  constructor() {
    super();
    this.storage = this.supabase.storage;
    this.realtime = this.supabase.realtime;
    this.db = { table: (relation: string) => this.supabase.from(relation) };
  }

  public override async init(...args: any): Promise<void> {
    // Create a single supabase client for interacting with your database
  }
}

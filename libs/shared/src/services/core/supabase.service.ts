import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments/src';
import { StorageClient } from '@supabase/storage-js';
import { createClient, RealtimeClient, SupabaseClient } from '@supabase/supabase-js';

import { PicsaAsyncService } from '../asyncService.service';

/** Key safe to use in browser (assuming tables have row-level security) */

@Injectable({ providedIn: 'root' })
export class SupabaseService extends PicsaAsyncService {
  private supabase: SupabaseClient;
  public storage: StorageClient;
  public realtime: RealtimeClient;

  public db: { table: SupabaseClient['from'] };

  constructor() {
    super();
    const { anonKey, apiUrl } = ENVIRONMENT.supabase;
    this.supabase = createClient(apiUrl, anonKey, {});
    this.storage = this.supabase.storage;
    this.realtime = this.supabase.realtime;
    this.db = { table: (relation: string) => this.supabase.from(relation) };
  }

  /** User shared credential to sign in as an anonymous user for supabase */
  async signInAnonymousUser() {
    const { email, password } = ENVIRONMENT.supabase.appUser;
    const res = await this.supabase.auth.signInWithPassword({ email, password: password || email });
    // TODO - could consider function to generate app user base on id which could also use
    // RLS for sync
    console.log('[Supabase Auth]', res);
  }

  public override async init(...args: any): Promise<void> {
    // Not currently required
  }
}

import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments/src';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { PicsaAsyncService } from '../../asyncService.service';
import { SupabaseAuthService } from './services/supabase-auth.service';
import { SupabaseStorageService } from './services/supabase-storage.service';

/**
 * Main entrypoint for interacting with Supabase backend
 * Module-specific code (e.g. storage, auth) injected via child services
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService extends PicsaAsyncService {
  /** Access to postgres db as a shortcut to table from method */
  public db: { table: SupabaseClient['from'] };

  private supabase: SupabaseClient;

  // private auth: SupabaseAuthClient;

  constructor(public storage: SupabaseStorageService, public auth: SupabaseAuthService) {
    super();
    const { anonKey, apiUrl } = ENVIRONMENT.supabase;
    this.supabase = createClient(apiUrl, anonKey, {});
    this.storage.registerSupabaseClient(this.supabase);
    this.auth.registerSupabaseClient(this.supabase);

    // this.auth = this.supabase.auth;
    this.db = { table: (relation: string) => this.supabase.from(relation) };
  }
  public override async init(): Promise<void> {
    await this.auth.ready();
  }
}

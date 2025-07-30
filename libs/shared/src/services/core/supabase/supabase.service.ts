import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments/src';
import { Database } from '@picsa/server-types';
import type { FunctionInvokeOptions } from '@supabase/functions-js';
import { createClient, FunctionsHttpError, SupabaseClient } from '@supabase/supabase-js';

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
  public db: { table: SupabaseClient<Database>['from'] };

  private supabase: SupabaseClient;

  constructor(
    public storage: SupabaseStorageService,
    public auth: SupabaseAuthService,
  ) {
    super();
  }

  public override async init(): Promise<void> {
    const { anonKey, apiUrl } = await ENVIRONMENT.supabase.load();
    this.supabase = createClient(apiUrl, anonKey, {});

    this.db = { table: (relation: string) => this.supabase.from(relation) };

    // register supabase instance with child services
    this.storage.registerSupabaseClient(this.supabase);
    this.auth.registerSupabaseClient(this.supabase);

    // trigger child service initialisers optimistically
    this.auth.ready();
    this.storage.ready();
  }

  /**
   * Invoke a supabase function by endpoint
   * Includes custom error handling of non-2xx response codes
   */
  public async invokeFunction<ResponseType>(endpoint: string, options: FunctionInvokeOptions = {}) {
    const { data, error } = await this.supabase.functions.invoke<ResponseType>(endpoint, {
      method: 'POST',
      body: {},
      ...options,
    });

    // Errors thrown from functions in JS client need to wait for message
    // https://github.com/supabase/functions-js/issues/45
    if (error && error instanceof FunctionsHttpError) {
      const errorMessage = await error.context.json();
      throw new Error(errorMessage);
    }

    return data as ResponseType;
  }
}

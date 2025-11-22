import { Injectable, Injector } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments';
import { Database } from '@picsa/server-types';
import type { FunctionInvokeOptions } from '@supabase/functions-js';
import { createClient, FunctionsHttpError, SupabaseClient } from '@supabase/supabase-js';
import * as z from 'zod';

const Config = z.object({
  anonKey: z.string(),
  apiUrl: z.string(),
});
type SupabaseConfig = z.infer<typeof Config>;
type Tables = Database['public']['Tables'];

import { PicsaAsyncService } from '../../asyncService.service';
import { SupabaseAuthService } from './services/supabase-auth.service';
import { SupabaseStorageService } from './services/supabase-storage.service';
import { TableWithSignal, tableWithSignal } from './utils/query.utils';

/**
 * Main entrypoint for interacting with Supabase backend
 * Module-specific code (e.g. storage, auth) injected via child services
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService extends PicsaAsyncService {
  /** Access to postgres db as a shortcut to table from method */
  public db: { table<T extends keyof Tables>(relation: T): TableWithSignal<T> };

  public config: SupabaseConfig;

  private supabase: SupabaseClient<Database>;

  constructor(
    private injector: Injector,
    public storage: SupabaseStorageService,
    public auth: SupabaseAuthService,
  ) {
    super();
  }

  public override async init(): Promise<void> {
    this.config = await this.loadConfig();

    const { apiUrl, anonKey } = this.config;

    this.supabase = createClient(apiUrl, anonKey, {});

    this.db = {
      table: (relation) => tableWithSignal(this.injector, this.supabase, relation),
    };

    // register supabase instance with child services
    this.storage.registerSupabaseClient(this.supabase);
    this.auth.registerSupabaseClient(this.supabase);

    // trigger child service initialisers optimistically
    this.auth.ready();
    this.storage.ready();
  }
  private async loadConfig(): Promise<SupabaseConfig> {
    const res = await fetch('/assets/supabase.config.json');
    if (res.ok) {
      try {
        const json = await res.json();
        const parsed = Config.parse(json);
        return parsed;
      } catch (error) {
        console.error('[Supabase] Config parse failed', error);
      }
    }
    // handle no, or invalid config
    if (ENVIRONMENT.production) {
      throw new Error(`[Supabase] Config - not available`);
    } else {
      console.warn(`[Supabase] Config - use dev config`);
      return {
        apiUrl: 'http://localhost:54321',
        anonKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      };
    }
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

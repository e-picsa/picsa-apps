import { Injectable } from '@angular/core';
import type { FunctionInvokeOptions } from '@supabase/functions-js';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { SupabaseDeferredClient } from './deferred-client';

const HEADER_PREFIX = `x-picsa`;

interface FunctionHeaders {
  deployment_id?: string;
}

/**
 * Utility class for interacting with supabase functions
 */
@Injectable({ providedIn: 'root' })
export class SupabaseFunctionsService extends SupabaseDeferredClient {
  private headers: Record<string, string> = {};

  /** Set common headers applied to all function invocations */
  public setHeaders(headers: FunctionHeaders) {
    this.headers = Object.fromEntries(
      Object.entries(headers)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [`${HEADER_PREFIX}-${key.replace(/_/g, '-')}`, value]),
    );
  }

  public async invoke<ResponseType>(endpoint: string, options: FunctionInvokeOptions = {}) {
    const { functions } = await this.getClient;
    const { data, error } = await functions.invoke<ResponseType>(endpoint, {
      method: 'POST',
      body: {},
      ...options,
      headers: { ...this.headers, ...options.headers },
    });

    // Errors thrown from functions in JS client need to wait for message
    // https://github.com/supabase/functions-js/issues/45
    if (error && error instanceof FunctionsHttpError) {
      const errorPayload = await error.context.json();
      const errorMessage = errorPayload?.message || errorPayload?.error || JSON.stringify(errorPayload);
      throw new Error(errorMessage);
    }

    return data as ResponseType;
  }
}

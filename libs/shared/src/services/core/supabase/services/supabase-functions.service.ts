import { Injectable } from '@angular/core';
import type { FunctionInvokeOptions } from '@supabase/functions-js';
import { FunctionsHttpError, SupabaseClient } from '@supabase/supabase-js';

const HEADER_PREFIX = `x-picsa`;

interface FunctionHeaders {
  deployment_id?: string;
}

/**
 * Utility class for interacting with supabase functions
 */
@Injectable({ providedIn: 'root' })
export class SupabaseFunctionsService {
  private functions: SupabaseClient['functions'];

  private headers: Record<string, string> = {};

  public registerSupabaseClient(client: SupabaseClient) {
    this.functions = client.functions;
  }

  /**
   * Set common headers to use whenever invoking functions
   */
  public setHeaders(headers: FunctionHeaders) {
    this.headers = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [`${HEADER_PREFIX}-${key.replace('_', '-')}`, value]),
    );
  }

  public async invoke<ResponseType>(endpoint: string, options: FunctionInvokeOptions = {}) {
    const { data, error } = await this.functions.invoke<ResponseType>(endpoint, {
      headers: this.headers,
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

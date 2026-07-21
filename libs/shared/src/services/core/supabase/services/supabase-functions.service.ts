import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '@picsa/environments';
import type { FunctionInvokeOptions } from '@supabase/functions-js';
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';

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

    if (error) {
      await this.handleFunctionsError(error);
    }

    return data as ResponseType;
  }

  private async handleFunctionsError(error: any): Promise<never> {
    let errorMessage = error.message;

    // Errors thrown from functions in JS client need to wait for message
    // https://github.com/supabase/functions-js/issues/45
    if (error instanceof FunctionsHttpError) {
      try {
        const errorPayload = await error.context.json();
        errorMessage = errorPayload?.message || errorPayload?.error || JSON.stringify(errorPayload);
      } catch {
        // context.json() may fail if response body is not valid JSON
      }
    }

    const isOffline =
      error instanceof FunctionsFetchError ||
      error instanceof FunctionsRelayError ||
      errorMessage?.toLowerCase()?.includes('name resolution failed') ||
      errorMessage?.toLowerCase()?.includes('failed to send a request to the edge function');

    if (!ENVIRONMENT.production && isOffline) {
      throw new Error(
        `Supabase Edge Functions endpoint is not running locally.\nPlease start it using: yarn nx run picsa-server:supabase functions serve`,
      );
    }

    throw new Error(errorMessage || error.message || 'An unknown error occurred');
  }
}

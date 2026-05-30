import type { Database } from '@picsa/server-types';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseDeferredClient {
  // Handle async client registration
  private clientReadyResolver!: (client: SupabaseClient) => void;

  /** Access client once registered */
  public getClient = new Promise<SupabaseClient<Database>>((resolve) => {
    this.clientReadyResolver = resolve;
  });

  /** As the auth service is a child of the main supabase service provide way to register parent client */
  public registerSupabaseClient(client: SupabaseClient) {
    this.clientReadyResolver(client);
    this.handleClientRegistered(client);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async handleClientRegistered(_client: SupabaseClient): Promise<void> {
    return;
  }
}

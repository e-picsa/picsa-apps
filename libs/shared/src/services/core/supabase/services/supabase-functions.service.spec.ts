import type { SupabaseClient } from '@supabase/supabase-js';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { SupabaseFunctionsService } from './supabase-functions.service';

describe('SupabaseFunctionsService', () => {
  let service: SupabaseFunctionsService;
  let mockSupabaseClient: any;
  let mockInvoke: jest.Mock;

  beforeEach(() => {
    mockInvoke = jest.fn();
    mockSupabaseClient = {
      functions: {
        invoke: mockInvoke,
      },
    };

    service = new SupabaseFunctionsService();
    service.registerSupabaseClient(mockSupabaseClient as unknown as SupabaseClient);
  });

  it('should return response data on successful invocation', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const result = await service.invoke<{ success: boolean }>('test-endpoint');

    expect(result).toEqual({ success: true });
    expect(mockInvoke).toHaveBeenCalledWith(
      'test-endpoint',
      expect.objectContaining({
        method: 'POST',
        body: {},
      }),
    );
  });

  it('should include custom headers set via setHeaders', async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    service.setHeaders({ deployment_id: 'dep-123' });
    await service.invoke('test-endpoint');

    expect(mockInvoke).toHaveBeenCalledWith(
      'test-endpoint',
      expect.objectContaining({
        headers: { 'x-picsa-deployment-id': 'dep-123' },
      }),
    );
  });

  it('should throw helpful error message in local dev when functions endpoint is not running', async () => {
    const error = new FunctionsHttpError({
      json: () => Promise.resolve({ error: 'name resolution failed' }),
    } as any);
    mockInvoke.mockResolvedValue({ data: null, error });

    await expect(service.invoke('test-endpoint')).rejects.toThrow(
      'Supabase Edge Functions endpoint is not running locally.\nPlease start it using: yarn nx run picsa-server:supabase functions serve',
    );
  });

  it('should throw original error message when error is not due to functions endpoint being down', async () => {
    const error = new FunctionsHttpError({
      json: () => Promise.resolve({ message: 'User not authorized' }),
    } as any);
    mockInvoke.mockResolvedValue({ data: null, error });

    await expect(service.invoke('test-endpoint')).rejects.toThrow('User not authorized');
  });
});

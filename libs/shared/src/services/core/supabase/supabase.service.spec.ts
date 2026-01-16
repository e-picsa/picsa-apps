import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SupabaseAuthService } from './services/supabase-auth.service';
import { SupabaseStorageService } from './services/supabase-storage.service';
import { SupabaseService } from './supabase.service';

// Mock child services
class MockAuthService {
  registerSupabaseClient = jest.fn();
  ready = jest.fn();
}

class MockStorageService {
  registerSupabaseClient = jest.fn();
  ready = jest.fn();
}

describe('SupabaseService', () => {
  let service: SupabaseService;
  let injector: Injector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SupabaseService,
        { provide: SupabaseAuthService, useClass: MockAuthService },
        { provide: SupabaseStorageService, useClass: MockStorageService },
        Injector,
      ],
    });
    service = TestBed.inject(SupabaseService);
    injector = TestBed.inject(Injector);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect backend as offline if check fails', async () => {
    // Mock fetch to reject (simulate offline)
    global.fetch = jest.fn(() => Promise.reject('Offline')) as any;

    // Mock loadConfig to return something valid
    jest.spyOn(service as any, 'loadConfig').mockResolvedValue({
      apiUrl: 'http://localhost:54321',
      anonKey: 'test-key',
    });

    await service.init();

    expect(service.isAvailable).toBe(false);
    expect(service.db).toBeDefined();

    // Verify stub behavior
    const query = service.db.table('users' as any).select('*');
    const result = await query;
    expect(result.data).toEqual([]); // Stub returns empty array

    // Verify Auth stub via service (indirectly)
    // The auth service would have registered the stub client.
    // We can verify that invoking a method on the client doesn't throw and returns what we expect
    const authRes = await service['supabase'].auth.getSession();
    expect(authRes.data.session).toBeNull();
  });

  it('should detect backend as online if check succeeds', async () => {
    // Mock fetch to resolve (simulate online)
    global.fetch = jest.fn(() => Promise.resolve({ ok: true } as Response));

    jest.spyOn(service as any, 'loadConfig').mockResolvedValue({
      apiUrl: 'http://localhost:54321',
      anonKey: 'test-key',
    });

    await service.init();

    expect(service.isAvailable).toBe(true);
  });
});

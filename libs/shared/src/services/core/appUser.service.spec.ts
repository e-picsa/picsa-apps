import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfigurationService } from '@picsa/configuration';
import { APP_VERSION } from '@picsa/environments/src/version';

import { AppUserService } from './appUser.service';
import { ErrorHandlerService } from './error-handler.service';
import { NetworkService } from './network.service';
import { SupabaseService } from './supabase/supabase.service';

jest.mock('@capacitor/core', () => {
  const actual = jest.requireActual('@capacitor/core');
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      getPlatform: jest.fn().mockReturnValue('android'),
      isNativePlatform: jest.fn().mockReturnValue(true),
    },
    registerPlugin: jest.fn().mockReturnValue({}),
  };
});

describe('AppUserService', () => {
  let service: AppUserService;
  let supabaseServiceMock: {
    ready: jest.Mock;
    isAvailable: jest.Mock;
    auth: {
      authUser: ReturnType<typeof signal>;
      signInAppUserOrAnonymous: jest.Mock;
    };
    db: {
      table: jest.Mock;
    };
  };
  let networkServiceMock: {
    isOnline: ReturnType<typeof signal>;
  };
  let configurationServiceMock: {
    userSettings: ReturnType<typeof signal>;
  };
  let errorHandlerMock: {
    handleError: jest.Mock;
  };
  let mockTable: {
    select: jest.Mock;
    eq: jest.Mock;
    maybeSingle: jest.Mock;
    insert: jest.Mock;
    single: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockTable = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnThis(),
    };

    supabaseServiceMock = {
      ready: jest.fn().mockResolvedValue(undefined),
      isAvailable: jest.fn().mockReturnValue(true),
      auth: {
        authUser: signal({ id: 'test-user-id', is_anonymous: false }),
        signInAppUserOrAnonymous: jest.fn().mockResolvedValue(undefined),
      },
      db: {
        table: jest.fn().mockReturnValue(mockTable),
      },
    };

    networkServiceMock = {
      isOnline: signal(true),
    };

    configurationServiceMock = {
      userSettings: signal({
        country_code: 'mw',
        language_code: 'en',
        user_type: 'farmer',
      }),
    };

    errorHandlerMock = {
      handleError: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AppUserService,
        { provide: SupabaseService, useValue: supabaseServiceMock },
        { provide: NetworkService, useValue: networkServiceMock },
        { provide: ConfigurationService, useValue: configurationServiceMock },
        { provide: ErrorHandlerService, useValue: errorHandlerMock },
      ],
    });

    service = TestBed.inject(AppUserService);
  });

  it('updates FCM token and timestamp on setFcmToken', () => {
    service.setFcmToken('test-token-123');
    expect(service.fcmToken()).toBe('test-token-123');
    // Calling setFcmToken again with same token should be a no-op
    const consoleSpy = jest.spyOn(console, 'log');
    service.setFcmToken('test-token-123');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('toggles internal tester status and persists to localStorage', () => {
    service.setInternalTester(false);
    expect(service.isInternalTester()).toBe(false);

    const result = service.toggleInternalTester();
    expect(result).toBe(true);
    expect(service.isInternalTester()).toBe(true);
    expect(localStorage.getItem('picsa_is_internal_tester')).toBe('true');
  });

  it('restores fcm_token from dbProfile during syncDbProfile', async () => {
    mockTable.maybeSingle.mockResolvedValue({
      data: {
        user_id: 'test-user-id',
        fcm_token: 'restored-token-xyz',
        fcm_token_updated_at: '2026-01-01T00:00:00Z',
        is_internal_tester: true,
      },
      error: null,
    });

    // Call private syncDbProfile method
    await (service as unknown as { syncDbProfile: (userId: string) => Promise<void> }).syncDbProfile('test-user-id');

    expect(service.isInternalTester()).toBe(true);
    expect(service.fcmToken()).toBe('restored-token-xyz');
    // Setting the same restored token should be a no-op since it was already restored into fcmToken
    const consoleSpy = jest.spyOn(console, 'log');
    service.setFcmToken('restored-token-xyz');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('creates profile if user profile not found in DB', async () => {
    mockTable.maybeSingle.mockResolvedValue({ data: null, error: null });
    const serviceInternal = service as unknown as {
      syncDbProfile: (userId: string) => Promise<void>;
      createUserProfile: (userId: string) => Promise<void>;
    };
    const createSpy = jest.spyOn(serviceInternal, 'createUserProfile').mockResolvedValue(undefined);

    await serviceInternal.syncDbProfile('test-user-id');

    expect(createSpy).toHaveBeenCalledWith('test-user-id');
  });

  it('aligns fcm_token_updated_at when local token already matches DB profile to avoid redundant sync', async () => {
    service.setFcmToken('same-token');
    mockTable.maybeSingle.mockResolvedValue({
      data: {
        user_id: 'test-user-id',
        country_code: 'mw',
        language_code: 'en',
        user_type: 'farmer',
        platform: 'android',
        app_version: APP_VERSION,
        fcm_token: 'same-token',
        fcm_token_updated_at: '2026-01-01T00:00:00Z',
        is_internal_tester: false,
      },
      error: null,
    });

    await (service as unknown as { syncDbProfile: (userId: string) => Promise<void> }).syncDbProfile('test-user-id');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingUpdate = (service as unknown as { pendingDBUpdate: () => any }).pendingDBUpdate();
    expect(pendingUpdate).toBeNull();
  });
});

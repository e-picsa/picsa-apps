import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

// eslint-disable-next-line @nx/enforce-module-boundaries
import locationMigration, { convertLegacyLocationTuple } from '../../migrations/migrations/20261121-location-selection';
import { ConfigurationService } from './provider';

describe('ConfigurationService per-country locations & one-time migration', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('preserves saved selections per country when switching between countries', () => {
    const service = TestBed.inject(ConfigurationService);

    service.updateUserSettings({ country_code: 'zm' });
    service.setLocationSelection({ province: 'southern', district: 'mazabuka' });

    service.updateUserSettings({ country_code: 'mw' });
    expect(service.activeLocationSelection()).toEqual({});
    service.setLocationSelection({ district: 'lilongwe' });

    service.updateUserSettings({ country_code: 'zm' });
    expect(service.activeLocationSelection()).toEqual({ province: 'southern', district: 'mazabuka' });

    service.updateUserSettings({ country_code: 'mw' });
    expect(service.activeLocationSelection()).toEqual({ district: 'lilongwe' });
  });

  it('migrates legacy location tuple once, strips legacy field, and returns diagnostic result', async () => {
    localStorage.setItem(
      'picsa_user_settings',
      JSON.stringify({
        country_code: 'mw',
        location: [null, null, 'mw', null, 'lilongwe'],
      }),
    );

    const injector = TestBed.inject(Injector);
    const service = TestBed.inject(ConfigurationService);
    const result = await locationMigration.up(injector);

    expect(service.activeLocationSelection()).toEqual({ district: 'lilongwe' });
    expect('location' in service.userSettings()).toBe(false);
    expect(result).toEqual({
      status: 'migrated',
      country: 'mw',
      from: [null, null, 'mw', null, 'lilongwe'],
      to: { district: 'lilongwe' },
    });
  });

  it('drops mismatched countries and unknown/stale ids in legacy tuple conversion', () => {
    expect(convertLegacyLocationTuple('mw', [undefined, undefined, 'zm', undefined, 'southern'])).toBeUndefined();
    expect(convertLegacyLocationTuple('mw', [undefined, undefined, 'mw', undefined, 'unknown_id'])).toBeUndefined();
    expect(convertLegacyLocationTuple('zw', [undefined, undefined, 'zw', undefined, 'masvingo', 'buhera'])).toEqual({
      province: 'masvingo',
    });
  });
});

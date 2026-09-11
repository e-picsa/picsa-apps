import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { NetworkService } from '../network.service';
import { DeviceInfoService } from './device-info.service';

describe('DeviceInfoService', () => {
  let service: DeviceInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DeviceInfoService,
        { provide: NetworkService, useValue: { isOnline: jest.fn().mockReturnValue(true) } },
        { provide: TranslateService, useValue: { currentLang: 'global_en' } },
      ],
    });
    service = TestBed.inject(DeviceInfoService);
  });

  it('collects web fallback device info', async () => {
    const info = await service.collect();
    expect(info.app_version).toBeDefined();
    expect(info.network_status).toBe('online');
    expect(info.locale).toBe('global_en');
    expect(info.screen_size).toMatch(/^\d+x\d+$/);
  });

  it('truncates all fields to max 64 characters', async () => {
    const info = await service.collect();
    for (const [, value] of Object.entries(info)) {
      if (value !== undefined) {
        expect(value.length).toBeLessThanOrEqual(64);
      }
    }
  });
});

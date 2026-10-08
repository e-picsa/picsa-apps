import { TestBed } from '@angular/core/testing';
import { PicsaTranslateService } from '@picsa/i18n';

import { NetworkService } from '../network.service';
import { DeviceInfoService } from './device-info.service';

describe('DeviceInfoService', () => {
  let service: DeviceInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DeviceInfoService,
        { provide: NetworkService, useValue: { isOnline: jest.fn().mockReturnValue(true) } },
        { provide: PicsaTranslateService, useValue: { currentLang: 'global_en' } },
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

  it('truncates fields within safe limits', async () => {
    const info = await service.collect();
    for (const [key, value] of Object.entries(info)) {
      if (value !== undefined) {
        const max = key === 'os_version' ? 200 : 64;
        expect(value.length).toBeLessThanOrEqual(max);
      }
    }
  });
});

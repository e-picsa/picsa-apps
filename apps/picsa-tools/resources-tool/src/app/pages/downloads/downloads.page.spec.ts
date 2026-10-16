import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ConfigurationService } from '@picsa/configuration/src';
import { PicsaTranslateModule } from '@picsa/i18n';
import { AppDistributionService } from '@picsa/shared/services/native';
import { of } from 'rxjs';

import { ResourcesDownloadService } from '../../services/resources-download.service';
import { ResourcesToolService } from '../../services/resources-tool.service';
import { DownloadsPageComponent } from './downloads.page';

describe('DownloadsComponent', () => {
  let component: DownloadsPageComponent;
  let fixture: ComponentFixture<DownloadsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadsPageComponent, PicsaTranslateModule.forRoot()],
      providers: [
        {
          provide: ConfigurationService,
          useValue: { userSettings: () => ({ country_code: 'mw', language_code: 'mw_ny', user_type: 'farmer' }) },
        },
        {
          provide: ResourcesToolService,
          useValue: { ready$: of(true), dbFiles: { find: () => ({ $: of([]) }) } },
        },
        { provide: ResourcesDownloadService, useValue: {} },
        {
          provide: AppDistributionService,
          useValue: {
            latestMeta: signal(null),
            cached: signal(null),
            isDownloading: signal(false),
            progress: signal(0),
            checkLatest: jest.fn().mockResolvedValue(null),
            cancelDownload: jest.fn(),
          },
        },
        { provide: MatDialog, useValue: { open: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

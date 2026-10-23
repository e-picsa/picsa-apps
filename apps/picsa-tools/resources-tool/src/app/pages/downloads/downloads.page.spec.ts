import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { ConfigurationService } from '@picsa/configuration/src';
import { PicsaTranslateModule } from '@picsa/i18n';
import { of } from 'rxjs';

import { ResourcesDownloadService } from '../../services/resources-download.service';
import { ResourcesToolService } from '../../services/resources-tool.service';
import { DownloadsPageComponent } from './downloads.page';

describe('DownloadsPageComponent', () => {
  let component: DownloadsPageComponent;
  let fixture: ComponentFixture<DownloadsPageComponent>;
  let addSvgIconSpy: jest.SpyInstance;

  const mockResourcesToolService = {
    ready$: of(true),
    dbFiles: {
      find: () => ({ $: of([]) }),
      findOne: () => ({ exec: jest.fn().mockResolvedValue(null) }),
    },
  };

  const mockConfigurationService = {
    userSettings: signal({
      country_code: 'zm',
      language_code: 'zm_en',
    }),
  };

  const mockDownloadService = {
    register: jest.fn(),
    queueMultiple: jest.fn(),
  };

  beforeEach(async () => {
    addSvgIconSpy = jest.spyOn(MatIconRegistry.prototype, 'addSvgIconInNamespace');

    await TestBed.configureTestingModule({
      imports: [DownloadsPageComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: ResourcesToolService, useValue: mockResourcesToolService },
        { provide: ConfigurationService, useValue: mockConfigurationService },
        { provide: ResourcesDownloadService, useValue: mockDownloadService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    addSvgIconSpy.mockRestore();
  });

  it('should create and register resources_tool icons in MatIconRegistry', () => {
    expect(component).toBeTruthy();
    expect(addSvgIconSpy).toHaveBeenCalledWith('resources_tool', 'filetype_video', expect.anything());
    expect(addSvgIconSpy).toHaveBeenCalledWith('resources_tool', 'filetype_pdf', expect.anything());
    expect(addSvgIconSpy).toHaveBeenCalledWith('resources_tool', 'filetype_document', expect.anything());
  });
});

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, Router } from '@angular/router';
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
  let router: Router;

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
        provideRouter([]),
        { provide: ResourcesToolService, useValue: mockResourcesToolService },
        { provide: ConfigurationService, useValue: mockConfigurationService },
        { provide: ResourcesDownloadService, useValue: mockDownloadService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadsPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
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

  it('should open downloaded resources in the viewer', async () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.handleRowClick({ id: 'resource-1', _downloaded: true } as any);

    expect(navigateSpy).toHaveBeenCalledWith(['resource-1'], { relativeTo: expect.anything() });
  });

  it('should download resources that have not yet been downloaded', async () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const download = jest.fn().mockResolvedValue(undefined);
    mockDownloadService.register.mockResolvedValue({ download });

    await component.handleRowClick({ id: 'resource-1', _downloaded: false, doc: {} } as any);

    expect(download).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

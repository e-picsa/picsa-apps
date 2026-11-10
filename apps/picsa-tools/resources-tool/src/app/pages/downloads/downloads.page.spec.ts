import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, Router } from '@angular/router';
import { ConfigurationService } from '@picsa/configuration/src';
import { PicsaTranslateModule } from '@picsa/i18n';
import { BehaviorSubject, of } from 'rxjs';

import { ResourcesDownloadService } from '../../services/resources-download.service';
import { ResourcesToolService } from '../../services/resources-tool.service';
import { DownloadsPageComponent } from './downloads.page';

describe('DownloadsPageComponent', () => {
  let component: DownloadsPageComponent;
  let fixture: ComponentFixture<DownloadsPageComponent>;
  let addSvgIconSpy: jest.SpyInstance;
  let router: Router;

  const mockManifestSignal = signal({
    collections: [],
    files: [] as any[],
    links: [],
    collectionsById: {},
    filesById: {} as Record<string, any>,
    linksById: {},
  });

  const mockDbFiles$ = new BehaviorSubject<any[]>([]);

  const mockResourcesToolService = {
    ready$: of(true),
    ready: jest.fn().mockResolvedValue(true),
    dbFiles: {
      find: () => ({ $: mockDbFiles$.asObservable() }),
      findOne: () => ({ exec: jest.fn().mockResolvedValue(null) }),
    },
    activeManifest: mockManifestSignal,
  };

  const mockConfigurationService = {
    userSettings: signal({
      country_code: 'zm',
      language_code: 'zm_en' as any,
    }),
    deploymentSettings: signal({
      country_code: 'zm',
    }),
  };

  const mockDownloadService = {
    register: jest.fn(),
    unregister: jest.fn(),
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

  it('should filter resources to only show those included in current deployment manifest', () => {
    mockManifestSignal.set({
      collections: [],
      files: [{ id: 'zm-file-1', title: 'ZM File', language: 'zm_en' }] as any[],
      links: [],
      collectionsById: {},
      filesById: {
        'zm-file-1': { id: 'zm-file-1', title: 'ZM File', language: 'zm_en' },
      },
      linksById: {},
    });

    const mockDocs = [
      { id: 'zm-file-1', _data: { id: 'zm-file-1', title: 'ZM File', language: 'zm_en', _attachments: {} } },
      { id: 'mw-file-1', _data: { id: 'mw-file-1', title: 'MW File', language: 'mw_ny', _attachments: {} } },
      { id: 'farmer-video-1', _data: { id: 'farmer-video-1', title: 'Video', _attachments: {} } },
    ];
    mockDbFiles$.next(mockDocs);
    fixture.detectChanges();

    const displayedIds = component.tableData().map((entry) => entry.id);
    expect(displayedIds).toEqual(['zm-file-1']);
  });

  it('should filter files by language within the active deployment manifest', () => {
    mockManifestSignal.set({
      collections: [],
      files: [
        { id: 'zm-file-en', title: 'ZM English', language: 'zm_en' },
        { id: 'zm-file-bem', title: 'ZM Bemba', language: 'zm_bem' },
      ] as any[],
      links: [],
      collectionsById: {},
      filesById: {
        'zm-file-en': { id: 'zm-file-en', title: 'ZM English', language: 'zm_en' },
        'zm-file-bem': { id: 'zm-file-bem', title: 'ZM Bemba', language: 'zm_bem' },
      },
      linksById: {},
    });

    const mockDocs = [
      { id: 'zm-file-en', _data: { id: 'zm-file-en', title: 'ZM English', language: 'zm_en', _attachments: {} } },
      { id: 'zm-file-bem', _data: { id: 'zm-file-bem', title: 'ZM Bemba', language: 'zm_bem', _attachments: {} } },
    ];
    mockDbFiles$.next(mockDocs);

    // Initial language is zm_en
    component.languageFilter.set('zm_en');
    fixture.detectChanges();
    expect(component.tableData().map((e) => e.id)).toEqual(['zm-file-en']);

    // Switch to zm_bem
    component.languageFilter.set('zm_bem' as any);
    fixture.detectChanges();
    expect(component.tableData().map((e) => e.id)).toEqual(['zm-file-bem']);

    // Deselect filter (undefined) -> show all in manifest
    component.languageFilter.set(undefined);
    fixture.detectChanges();
    expect(component.tableData().map((e) => e.id)).toEqual(['zm-file-en', 'zm-file-bem']);
  });
});

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

  it('should include all downloadable resources relevant to current deployment (manifest files, manuals, farmer videos, and global files)', () => {
    mockManifestSignal.set({
      collections: [],
      files: [{ id: 'zm-bundle-1', title: 'ZM Extension Doc', language: 'zm_en' }] as any[],
      links: [],
      collectionsById: {},
      filesById: {
        'zm-bundle-1': { id: 'zm-bundle-1', title: 'ZM Extension Doc', language: 'zm_en' },
      },
      linksById: {},
    });

    const mockDocs = [
      // 1. ZM Bundle file
      {
        id: 'zm-bundle-1',
        _data: { id: 'zm-bundle-1', title: 'ZM Extension Doc', language: 'zm_en', _attachments: {} },
      },
      // 2. Global English manual
      {
        id: 'picsa_manual',
        _data: { id: 'picsa_manual', title: 'PICSA Manual', language: 'global_en', _attachments: {} },
      },
      // 3. Multi-country manual matching ZM
      {
        id: 'picsa_manual_chichewa',
        _data: {
          id: 'picsa_manual_chichewa',
          title: 'Buku',
          language: 'mw_ny',
          filter: { countries: ['mw', 'zm'] },
          _attachments: {},
        },
      },
      // 4. Country manual for another country (TJ)
      {
        id: 'picsa_manual_tajik',
        _data: {
          id: 'picsa_manual_tajik',
          title: 'Tajik Manual',
          language: 'tj_tg',
          filter: { countries: ['tj'] },
          _attachments: {},
        },
      },
      // 5. ZM Farmer video
      { id: 'video_zm_bem', _data: { id: 'video_zm_bem', title: 'Video Bemba', language: 'zm_bem', _attachments: {} } },
      // 6. Global Farmer video
      {
        id: 'video_global_en',
        _data: { id: 'video_global_en', title: 'Video Global EN', language: 'global_en', _attachments: {} },
      },
      // 7. MW Farmer video (other country)
      { id: 'video_mw_ny', _data: { id: 'video_mw_ny', title: 'Video MW', language: 'mw_ny', _attachments: {} } },
      // 8. MW Bundle file (other country)
      {
        id: 'mw-bundle-1',
        _data: {
          id: 'mw-bundle-1',
          title: 'MW Extension Doc',
          language: 'mw_en',
          filter: { countries: ['mw'] },
          _attachments: {},
        },
      },
    ];
    mockDbFiles$.next(mockDocs);

    // Unselected language filter: should include all files relevant to ZM, excluding other countries
    component.languageFilter.set(undefined);
    fixture.detectChanges();

    const displayedIds = component.tableData().map((entry) => entry.id);
    expect(displayedIds).toContain('zm-bundle-1');
    expect(displayedIds).toContain('picsa_manual');
    expect(displayedIds).toContain('picsa_manual_chichewa');
    expect(displayedIds).toContain('video_zm_bem');
    expect(displayedIds).toContain('video_global_en');

    // Should strictly exclude other country files
    expect(displayedIds).not.toContain('picsa_manual_tajik');
    expect(displayedIds).not.toContain('video_mw_ny');
    expect(displayedIds).not.toContain('mw-bundle-1');
  });

  it('should filter files by language within the active deployment', () => {
    mockManifestSignal.set({
      collections: [],
      files: [{ id: 'zm-bundle-en', title: 'ZM Doc EN', language: 'zm_en' }] as any[],
      links: [],
      collectionsById: {},
      filesById: {
        'zm-bundle-en': { id: 'zm-bundle-en', title: 'ZM Doc EN', language: 'zm_en' },
      },
      linksById: {},
    });

    const mockDocs = [
      { id: 'zm-bundle-en', _data: { id: 'zm-bundle-en', title: 'ZM Doc EN', language: 'zm_en', _attachments: {} } },
      { id: 'video_zm_en', _data: { id: 'video_zm_en', title: 'ZM Video EN', language: 'zm_en', _attachments: {} } },
      {
        id: 'video_global_en',
        _data: { id: 'video_global_en', title: 'Global Video EN', language: 'global_en', _attachments: {} },
      },
      {
        id: 'video_zm_bem',
        _data: { id: 'video_zm_bem', title: 'ZM Video Bemba', language: 'zm_bem', _attachments: {} },
      },
      {
        id: 'picsa_manual_chichewa',
        _data: {
          id: 'picsa_manual_chichewa',
          title: 'Buku',
          language: 'mw_ny',
          filter: { countries: ['mw', 'zm'] },
          _attachments: {},
        },
      },
    ];
    mockDbFiles$.next(mockDocs);

    // 1. Filter by English ('zm_en'): includes zm_en, global_en
    component.languageFilter.set('zm_en');
    fixture.detectChanges();
    expect(component.tableData().map((e) => e.id)).toEqual(['zm-bundle-en', 'video_zm_en', 'video_global_en']);

    // 2. Filter by Bemba ('zm_bem'): includes zm_bem only
    component.languageFilter.set('zm_bem' as any);
    fixture.detectChanges();
    expect(component.tableData().map((e) => e.id)).toEqual(['video_zm_bem']);

    // 3. Filter by Nyanja ('zm_ny'): matches cross-border 'mw_ny' manual because filter.countries includes 'zm'
    component.languageFilter.set('zm_ny' as any);
    fixture.detectChanges();
    expect(component.tableData().map((e) => e.id)).toEqual(['picsa_manual_chichewa']);

    // 4. Clear filter (undefined): shows all deployment files
    component.languageFilter.set(undefined);
    fixture.detectChanges();
    expect(component.tableData().map((e) => e.id)).toEqual([
      'zm-bundle-en',
      'video_zm_en',
      'video_global_en',
      'video_zm_bem',
      'picsa_manual_chichewa',
    ]);
  });

  describe('table category column, type filter, and pending downloads', () => {
    it('should configure tableOptions with category and subtype in filterColumns, omit language column, and format header', () => {
      expect(component.tableOptions.displayColumns).toContain('category');
      expect(component.tableOptions.displayColumns).not.toContain('language');
      expect(component.tableOptions.filterColumns).toEqual(['category', 'subtype']);
      expect(component.tableOptions.formatHeader?.('category')).toBe('Category');
      expect(component.tableOptions.formatHeader?.('source')).toBe('Category');
      expect(component.tableOptions.formatHeader?.('subtype')).toBe('Type');
      expect(component.tableOptions.formatHeader?.('size_kb')).toBe('Size');
      expect(component.tableOptions.formatHeader?.('_downloaded')).toBe('');
      expect(component.tableOptions.formatHeader?.('_actions')).toBe('');
    });

    it('should initialize languageFilter to current user language on first viewing', () => {
      expect(component.languageFilter()).toBe('zm_en');
    });

    it('should accurately resolve category across registries with blank fallback for unknowns', () => {
      mockManifestSignal.set({
        collections: [],
        files: [{ id: 'active-manifest-file', title: 'Manifest File' }] as any[],
        links: [],
        collectionsById: {},
        filesById: {
          'active-manifest-file': { id: 'active-manifest-file', title: 'Manifest File' },
        },
        linksById: {},
      });

      // 1. Active manifest file -> 'Extension Resource'
      expect(component.getResourceCategory('active-manifest-file')).toBe('Extension Resource');
      expect(component.getResourceSource('active-manifest-file')).toBe('Extension Resource');

      // 2. PICSA Manual -> 'PICSA Manual'
      expect(component.getResourceCategory('picsa_manual')).toBe('PICSA Manual');
      expect(component.getResourceCategory('picsa_manual_chichewa')).toBe('PICSA Manual');

      // 3. Digital Skills -> 'Digital Skills'
      expect(component.getResourceCategory('digital_skills_1_introduction_global_en_360p')).toBe('Digital Skills');

      // 4. Farmer Video -> 'Farmer Video'
      expect(component.getResourceCategory('farmer_intro_zm_bem_360p')).toBe('Farmer Video');

      // 5. Unrecognized resource -> '' (blank, never defaults to Farmer Video)
      expect(component.getResourceCategory('unrecognized_file_id')).toBe('');
    });

    it('should populate category and source in tableData entries', () => {
      mockManifestSignal.set({
        collections: [],
        files: [{ id: 'ext-doc', title: 'Extension Document' }] as any[],
        links: [],
        collectionsById: {},
        filesById: {
          'ext-doc': { id: 'ext-doc', title: 'Extension Document' },
        },
        linksById: {},
      });

      mockDbFiles$.next([
        { id: 'ext-doc', _data: { id: 'ext-doc', title: 'Extension Document', _attachments: {} } },
        { id: 'picsa_manual', _data: { id: 'picsa_manual', title: 'Manual', language: 'global_en', _attachments: {} } },
        {
          id: 'digital_skills_1_introduction_global_en_360p',
          _data: {
            id: 'digital_skills_1_introduction_global_en_360p',
            title: 'Intro Digital',
            language: 'global_en',
            _attachments: {},
          },
        },
        {
          id: 'farmer_intro_zm_bem_360p',
          _data: {
            id: 'farmer_intro_zm_bem_360p',
            title: 'Farmer Intro Bemba',
            language: 'zm_bem',
            _attachments: {},
          },
        },
        {
          id: 'custom_unknown',
          _data: { id: 'custom_unknown', title: 'Unknown', language: 'global_en', _attachments: {} },
        },
      ]);

      component.languageFilter.set(undefined);
      fixture.detectChanges();

      const tableData = component.tableData();
      const byId = Object.fromEntries(tableData.map((row) => [row.id, row.category]));

      expect(byId['ext-doc']).toBe('Extension Resource');
      expect(byId['picsa_manual']).toBe('PICSA Manual');
      expect(byId['digital_skills_1_introduction_global_en_360p']).toBe('Digital Skills');
      expect(byId['farmer_intro_zm_bem_360p']).toBe('Farmer Video');
      expect(byId['custom_unknown']).toBe('');
    });

    it('should update pendingDownloads when table filtering is applied via filteredTableData', () => {
      mockManifestSignal.set({
        collections: [],
        files: [
          { id: 'ext-1', title: 'Doc 1' },
          { id: 'ext-2', title: 'Doc 2' },
        ] as any[],
        links: [],
        collectionsById: {},
        filesById: {
          'ext-1': { id: 'ext-1', title: 'Doc 1' },
          'ext-2': { id: 'ext-2', title: 'Doc 2' },
        },
        linksById: {},
      });

      mockDbFiles$.next([
        { id: 'ext-1', size_kb: 100, _data: { id: 'ext-1', title: 'Doc 1', size_kb: 100, _attachments: {} } },
        { id: 'ext-2', size_kb: 200, _data: { id: 'ext-2', title: 'Doc 2', size_kb: 200, _attachments: {} } },
      ]);

      component.languageFilter.set(undefined);
      fixture.detectChanges();

      // Initially all pending downloads included
      expect(component.pendingDownloads().map((d) => d.id)).toEqual(['ext-1', 'ext-2']);
      expect(component.pendingDownloadsSize()).toBe(300);

      // Simulate table filteredData event emission (e.g. filtered to ext-2)
      const filtered = component.tableData().filter((row) => row.id === 'ext-2');
      component.filteredTableData.set(filtered);
      fixture.detectChanges();

      expect(component.pendingDownloads().map((d) => d.id)).toEqual(['ext-2']);
      expect(component.pendingDownloadsSize()).toBe(200);
    });
  });
});

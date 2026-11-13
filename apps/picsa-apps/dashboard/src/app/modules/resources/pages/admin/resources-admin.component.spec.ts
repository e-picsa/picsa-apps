import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow, IResourceFileRow, IResourceLinkRow } from '../../types';
import { ResourcesAdminComponent } from './resources-admin.component';

describe('ResourcesAdminComponent', () => {
  let component: ResourcesAdminComponent;
  let fixture: ComponentFixture<ResourcesAdminComponent>;
  const mockDeployment = signal<{ country_code: string; label: string }>({
    country_code: 'mw',
    label: 'Malawi',
  });

  const mockCollections = signal<Partial<IResourceCollectionRow>[]>([
    {
      id: 'cropResources_mw',
      title: 'Crop, Pest & Disease',
      description: 'Resources to help care for crops',
      cover_image: 'global/resources/covers/crops.svg',
      resource_files: ['gap', 'bmtm'],
      resource_links: ['accessAg', 'plantwise'],
      sort_order: 7,
      country_code: 'mw',
    },
    {
      id: 'new_db_collection',
      title: 'Brand New Collection',
      description: 'Not in app bundle yet',
      cover_image: null,
      resource_files: [],
      resource_links: [],
      sort_order: 1,
      country_code: 'mw',
    },
  ]);

  const mockFiles = signal<Partial<IResourceFileRow>[]>([
    {
      id: 'gap',
      title: 'GAP manual',
      storage_file: 'mw/resources/gap.pdf',
      country_code: 'mw',
    },
  ]);

  const mockLinks = signal<Partial<IResourceLinkRow>[]>([
    {
      id: 'accessAg',
      title: 'Access Agriculture',
      url: 'https://www.accessagriculture.org',
      country_code: 'mw',
      type: 'web',
    },
  ]);

  beforeEach(async () => {
    const mockDeploymentService = {
      activeDeployment: mockDeployment,
      activeDeploymentCountry: () => mockDeployment()?.country_code,
    };

    const mockResourcesService = {
      collections: mockCollections,
      files: mockFiles,
      links: mockLinks,
      ready: () => Promise.resolve(),
    };

    await TestBed.configureTestingModule({
      imports: [ResourcesAdminComponent],
      providers: [
        provideRouter([]),
        { provide: DeploymentDashboardService, useValue: mockDeploymentService },
        { provide: ResourcesDashboardService, useValue: mockResourcesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourcesAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute diff rows identifying in-sync, modified, and missing-in-app items', () => {
    const rows = component.allDiffRows();
    expect(rows.length).toBeGreaterThan(0);

    const newColRow = rows.find((r) => r.id === 'new_db_collection');
    expect(newColRow).toBeDefined();
    expect(newColRow?.status).toBe('Missing in App');

    const stats = component.stats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.missingInApp).toBeGreaterThanOrEqual(1);
  });

  it('should filter rows by kind, actionable status, and status chip toggle', () => {
    component.selectedKind.set('Collection');
    const collectionRows = component.displayedRows();
    expect(collectionRows.every((r) => r.kind === 'Collection')).toBe(true);

    component.selectedStatus.set('actionable');
    const actionableRows = component.displayedRows();
    expect(actionableRows.every((r) => r.status !== 'In Sync')).toBe(true);

    component.selectedKind.set('all');
    component.toggleStatusFilter('Missing in App');
    expect(component.selectedStatus()).toBe('Missing in App');
    expect(component.displayedRows().every((r) => r.status === 'Missing in App')).toBe(true);

    component.toggleStatusFilter('Missing in App');
    expect(component.selectedStatus()).toBe('all');
  });

  it('should treat DB cover paths matching synced bundle webp/svg paths as In Sync', () => {
    // '29be07fe-cc1b-41c9-8689-26e6ec4718f0' in mw.json has:
    // cover_image: "assets/resources/covers/mw/Cover Image.webp"
    mockFiles.set([
      {
        id: '29be07fe-cc1b-41c9-8689-26e6ec4718f0',
        title: 'MAIZE PRODUCTION',
        storage_file: 'mw/resources/Guide to Maize Production _ Final @@ With Cover.pdf',
        cover_image: 'mw/resources/covers/Cover Image.png',
        language_code: 'mw_en',
        external_url: '',
        country_code: 'mw',
      },
    ]);
    // 'accessAg' in mw.json has cover_image: "assets/resources/covers/access-ag.webp"
    mockLinks.set([
      {
        id: 'accessAg',
        title: 'Access Agriculture',
        url: 'https://www.accessagriculture.org',
        type: 'web',
        cover_image: 'global/resources/covers/access-ag.jpg',
        country_code: 'mw',
      },
    ]);
    fixture.detectChanges();

    const rows = component.allDiffRows();
    const fileRow = rows.find((r) => r.id === '29be07fe-cc1b-41c9-8689-26e6ec4718f0');
    const linkRow = rows.find((r) => r.id === 'accessAg');
    const colRow = rows.find((r) => r.id === 'cropResources_mw');

    expect(fileRow?.status).toBe('In Sync');
    expect(linkRow?.status).toBe('In Sync');
    expect(colRow?.detail).not.toContain('Cover image changed');
  });
});

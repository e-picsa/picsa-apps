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

  it('should filter rows by kind and status', () => {
    component.selectedKind.set('Collection');
    const collectionRows = component.displayedRows();
    expect(collectionRows.every((r) => r.kind === 'Collection')).toBe(true);

    component.selectedStatus.set('actionable');
    const actionableRows = component.displayedRows();
    expect(actionableRows.every((r) => r.status !== 'In Sync')).toBe(true);
  });
});

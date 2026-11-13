import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceFileRow, IResourceLinkRow } from '../../../types';
import { ResourceCollectionEditComponent } from './resource-collection-edit.component';

describe('ResourceCollectionEditComponent', () => {
  let component: ResourceCollectionEditComponent;
  let fixture: ComponentFixture<ResourceCollectionEditComponent>;
  let mockRoles: ReturnType<typeof signal<string[]>>;
  let mockUserId: ReturnType<typeof signal<string | undefined>>;
  const mockDeployment = signal<{ country_code: string; label: string }>({
    country_code: 'mw',
    label: 'Malawi',
  });

  const mockFiles = signal<Partial<IResourceFileRow>[]>([
    { id: 'file-1', title: 'Maize Manual', filename: 'maize.pdf', language_code: 'mw_en', size_kb: 1024 },
    { id: 'file-2', title: 'Rainfall Guide', filename: 'rain.pdf', language_code: 'mw_ny', size_kb: 512 },
  ]);
  const mockLinks = signal<Partial<IResourceLinkRow>[]>([
    { id: 'link-1', title: 'Weather Portal', url: 'https://weather.example.org', type: 'web' },
    { id: 'link-2', title: 'Mobile App', url: 'https://play.google.com/store', type: 'app' },
  ]);

  beforeEach(async () => {
    mockRoles = signal<string[]>([]);
    mockUserId = signal<string | undefined>('user-1');

    const mockAuthService = {
      authUserId: mockUserId,
      hasRole: (role?: string) => (role ? mockRoles().includes(role) : true),
    };

    const mockDeploymentService = {
      activeDeployment: mockDeployment,
      activeDeploymentCountry: () => mockDeployment()?.country_code,
    };

    const mockResourcesService = {
      files: mockFiles,
      links: mockLinks,
      collections: signal([]),
      tables: {
        collections: {
          select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
        },
      },
      ready: () => Promise.resolve(),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceCollectionEditComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardAuthService, useValue: mockAuthService },
        { provide: DeploymentDashboardService, useValue: mockDeploymentService },
        { provide: ResourcesDashboardService, useValue: mockResourcesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceCollectionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create without sort_order control', () => {
    expect(component).toBeTruthy();
    expect('sort_order' in component.form.controls).toBe(false);
  });

  it('should allow any resources.editor to edit collections while gating deletion to owner or admin', () => {
    component.isCreate.set(false);
    component.resourceOwner.set('owner-123');

    // Read-only user cannot edit or delete
    mockRoles.set([]);
    mockUserId.set('owner-123');
    expect(component.canEdit()).toBe(false);
    expect(component.canDelete()).toBe(false);

    // Editor who does not own the collection can edit, but cannot delete
    mockRoles.set(['resources.editor']);
    mockUserId.set('other-user');
    expect(component.canEdit()).toBe(true);
    expect(component.canDelete()).toBe(false);

    // Editor who owns the collection can edit and delete
    mockUserId.set('owner-123');
    expect(component.canEdit()).toBe(true);
    expect(component.canDelete()).toBe(true);

    // Admin can edit and delete any collection
    mockRoles.set(['resources.admin', 'resources.editor']);
    mockUserId.set('other-user');
    expect(component.canEdit()).toBe(true);
    expect(component.canDelete()).toBe(true);

    // Create mode never allows delete
    component.isCreate.set(true);
    expect(component.canEdit()).toBe(true);
    expect(component.canDelete()).toBe(false);
  });

  it('should toggle files and links and filter by search and selected state', () => {
    mockRoles.set(['resources.admin']);
    fixture.detectChanges();

    component.form.controls.title.setValue('Test Collection');
    component.toggleFile('file-1');
    component.toggleLink('link-2');

    expect(component.form.valid).toBe(true);
    expect(component.form.dirty).toBe(true);
    expect(component.form.value.resource_files).toEqual(['file-1']);
    expect(component.form.value.resource_links).toEqual(['link-2']);

    // Filter by selected
    component.filesViewFilter.set('selected');
    expect(component.filteredFiles().map((f) => f.id)).toEqual(['file-1']);

    // Filter by search
    component.filesViewFilter.set('all');
    component.filesSearch.set('rain.pdf');
    expect(component.filteredFiles().map((f) => f.id)).toEqual(['file-2']);

    component.linksSearch.set('portal');
    expect(component.filteredLinks().map((l) => l.id)).toEqual(['link-1']);

    // Toggle off
    component.toggleFile('file-1');
    expect(component.form.value.resource_files).toEqual([]);
  });
});

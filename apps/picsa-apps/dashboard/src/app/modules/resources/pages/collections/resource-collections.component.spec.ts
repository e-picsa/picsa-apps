import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow } from '../../types';
import { ICollectionTableRow, ResourceCollectionsComponent } from './resource-collections.component';

describe('ResourceCollectionsComponent', () => {
  let component: ResourceCollectionsComponent;
  let fixture: ComponentFixture<ResourceCollectionsComponent>;
  let router: Router;

  const mockCollections = signal<Partial<IResourceCollectionRow>[]>([
    {
      id: 'col-1',
      title: 'Collection A',
      modified_at: '2026-01-02T00:00:00Z',
      resource_files: ['file-1', 'file-2'],
      resource_links: ['link-1'],
    },
    {
      id: 'col-2',
      title: 'Collection B',
      modified_at: '2026-01-01T00:00:00Z',
      resource_files: [],
      resource_links: [],
    },
  ]);

  beforeEach(async () => {
    const mockDeployment = signal<{ country_code: string; label: string }>({
      country_code: 'mw',
      label: 'Malawi',
    });

    const mockDeploymentService = {
      activeDeployment: mockDeployment,
      activeDeploymentCountry: () => mockDeployment()?.country_code,
    };

    const mockResourcesService = {
      collections: mockCollections,
      ready: () => Promise.resolve(),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceCollectionsComponent],
      providers: [
        provideRouter([]),
        { provide: DeploymentDashboardService, useValue: mockDeploymentService },
        { provide: ResourcesDashboardService, useValue: mockResourcesService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ResourceCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map collections with files_count and links_count', () => {
    const list = component.collections();
    expect(list.length).toBe(2);
    expect(list[0].id).toBe('col-1');
    expect(list[0].files_count).toBe(2);
    expect(list[0].links_count).toBe(1);

    expect(list[1].id).toBe('col-2');
    expect(list[1].files_count).toBe(0);
    expect(list[1].links_count).toBe(0);
  });

  it('should navigate to collection edit on row click', () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const mockEvent = { stopImmediatePropagation: jest.fn() } as unknown as Event;
    const row = component.collections()[0];

    component.tableOptions.handleRowClick?.(row as unknown as ICollectionTableRow, mockEvent);
    expect(navigateSpy).toHaveBeenCalledWith(['col-1'], expect.objectContaining({ relativeTo: expect.anything() }));
  });
});

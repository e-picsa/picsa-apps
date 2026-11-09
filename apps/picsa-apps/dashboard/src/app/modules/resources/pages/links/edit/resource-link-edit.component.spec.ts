import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { ResourcesDashboardService } from '../../../resources.service';
import { ResourceLinkEditComponent } from './resource-link-edit.component';

describe('ResourceLinkEditComponent', () => {
  let component: ResourceLinkEditComponent;
  let fixture: ComponentFixture<ResourceLinkEditComponent>;
  const activeRoles = signal<string[]>([]);
  const activeUser = signal<string | undefined>('author-id');
  const mockDeployment = signal<any>({ country_code: 'mw', label: 'Malawi' });

  beforeEach(async () => {
    activeRoles.set([]);
    activeUser.set('author-id');

    const mockDeploymentService = {
      activeDeployment: mockDeployment,
      activeDeploymentCountry: () => mockDeployment()?.country_code,
    };

    const mockResourcesService = {
      ready: () => Promise.resolve(),
      tables: { links: { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) } },
    };

    await TestBed.configureTestingModule({
      imports: [ResourceLinkEditComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardAuthService,
          useValue: {
            authUserId: activeUser,
            hasRole: (r?: string) => (r ? activeRoles().includes(r) : true),
          },
        },
        { provide: DeploymentDashboardService, useValue: mockDeploymentService },
        { provide: ResourcesDashboardService, useValue: mockResourcesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceLinkEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('disables form for non-owner editors and enables for owners or admins', () => {
    component.isCreate.set(false);
    (component as any).resourceOwner.set('author-id');

    activeRoles.set(['resources.editor']);
    activeUser.set('different-user');
    fixture.detectChanges();
    expect(component.canEdit()).toBe(false);
    expect(component.form.disabled).toBe(true);

    activeUser.set('author-id');
    fixture.detectChanges();
    expect(component.canEdit()).toBe(true);
    expect(component.form.enabled).toBe(true);
  });

  it('should mark form and cover_image control dirty when cover image upload completes', async () => {
    expect(component.form.pristine).toBe(true);
    expect(component.form.controls.cover_image.pristine).toBe(true);

    const mockUploadResult = [
      {
        meta: {
          bucketName: 'mw',
          objectName: 'resources/covers/link-cover.png',
          cacheControl: 3600,
        },
      },
    ];

    await component.handleUploadComplete(mockUploadResult as any);

    expect(component.form.controls.cover_image.value).toBe('mw/resources/covers/link-cover.png');
    expect(component.form.controls.cover_image.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);
  });

  it('should mark form and cover_image control dirty when selecting or clearing storage file', () => {
    expect(component.form.pristine).toBe(true);

    component.handleStorageFileSelected({
      bucket_id: 'mw',
      name: 'resources/covers/existing.jpg',
      metadata: {} as any,
    });
    expect(component.form.controls.cover_image.value).toBe('mw/resources/covers/existing.jpg');
    expect(component.form.controls.cover_image.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);

    component.handleStorageFileSelected(undefined);
    expect(component.form.controls.cover_image.value).toBe('');
    expect(component.form.controls.cover_image.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);
  });
});

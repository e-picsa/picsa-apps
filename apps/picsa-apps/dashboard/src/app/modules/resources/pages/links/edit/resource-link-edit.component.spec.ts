import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { DashboardStorageService, DashboardStorageUploadComponent } from '../../../../storage';
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
      collections: signal([]),
      ready: () => Promise.resolve(),
      tables: { links: { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) } },
    };

    const mockSupabaseService = {
      ready: () => new Promise(() => undefined),
      config: { apiUrl: 'http://localhost:54321', anonKey: 'test-key' },
      storage: {
        getFile: jest.fn().mockResolvedValue(null),
        getPublicLink: jest.fn((bucket: string, path: string) => `http://localhost/${bucket}/${path}`),
      },
    };

    const mockDashboardStorageService = {
      getStorageFileByPath: jest.fn().mockResolvedValue(null),
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
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: DashboardStorageService, useValue: mockDashboardStorageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceLinkEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getCoverUploadComponent(): DashboardStorageUploadComponent {
    return fixture.debugElement.query(By.directive(DashboardStorageUploadComponent)).componentInstance;
  }

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

  it('should mark form and cover_image control dirty when cover image upload completes', () => {
    activeRoles.set(['resources.editor']);
    fixture.detectChanges();

    expect(component.form.pristine).toBe(true);
    expect(component.form.controls.cover_image.pristine).toBe(true);

    const coverUpload = getCoverUploadComponent();
    expect(coverUpload.maxFileSizeMB()).toBe(5);

    coverUpload.handleUploadComplete([
      {
        data: new File(['mock'], 'link-cover.png', { type: 'image/png' }),
        meta: {
          bucketName: 'mw',
          objectName: 'resources/covers/link-cover.png',
          cacheControl: 3600,
        },
      },
    ]);

    expect(component.form.controls.cover_image.value).toBe('mw/resources/covers/link-cover.png');
    expect(component.form.controls.cover_image.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);
  });

  it('should mark form and cover_image control dirty when selecting or clearing storage file', () => {
    activeRoles.set(['resources.editor']);
    fixture.detectChanges();

    expect(component.form.pristine).toBe(true);

    const coverUpload = getCoverUploadComponent();
    coverUpload.handleStorageFileSelected({
      bucket_id: 'mw',
      name: 'resources/covers/existing.jpg',
      metadata: {} as any,
    });
    expect(component.form.controls.cover_image.value).toBe('mw/resources/covers/existing.jpg');
    expect(component.form.controls.cover_image.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);

    coverUpload.clearValue();
    expect(component.form.controls.cover_image.value).toBe('');
    expect(component.form.controls.cover_image.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);
  });
});

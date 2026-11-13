import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { DashboardStorageService, DashboardStorageUploadComponent } from '../../../../storage';
import { ResourcesDashboardService } from '../../../resources.service';
import { ResourceFileEditComponent } from './resource-file-edit.component';

describe('ResourceFileEditComponent', () => {
  let component: ResourceFileEditComponent;
  let fixture: ComponentFixture<ResourceFileEditComponent>;
  let mockRoles: ReturnType<typeof signal<string[]>>;
  let mockUserId: ReturnType<typeof signal<string | undefined>>;
  const mockDeployment = signal<any>({ country_code: 'mw', label: 'Malawi' });

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
      collections: signal([]),
      ready: () => Promise.resolve(),
      tables: { files: { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) } },
      getResourceCollections: () => [],
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
      imports: [ResourceFileEditComponent, PicsaTranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: DashboardAuthService, useValue: mockAuthService },
        { provide: DeploymentDashboardService, useValue: mockDeploymentService },
        { provide: ResourcesDashboardService, useValue: mockResourcesService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: DashboardStorageService, useValue: mockDashboardStorageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceFileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getUploadComponent(folder: string): DashboardStorageUploadComponent {
    const uploadDebugEl = fixture.debugElement
      .queryAll(By.directive(DashboardStorageUploadComponent))
      .find((el) => (el.componentInstance as DashboardStorageUploadComponent).storageFolderPath() === folder);
    if (!uploadDebugEl) {
      throw new Error(`DashboardStorageUploadComponent for folder '${folder}' not found`);
    }
    return uploadDebugEl.componentInstance as DashboardStorageUploadComponent;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enforce owner-based edit permissions for resources.editor and full access for resources.admin', () => {
    component.isCreate.set(false);
    (component as any).resourceOwner.set('owner-123');

    // Read-only user cannot edit
    mockRoles.set([]);
    mockUserId.set('owner-123');
    expect(component.canEdit()).toBe(false);

    // Editor who does not own the resource cannot edit
    mockRoles.set(['resources.editor']);
    mockUserId.set('other-user');
    expect(component.canEdit()).toBe(false);

    // Editor who owns the resource can edit
    mockUserId.set('owner-123');
    expect(component.canEdit()).toBe(true);

    // Admin can edit any resource regardless of owner
    mockRoles.set(['resources.admin', 'resources.editor']);
    mockUserId.set('other-user');
    expect(component.canEdit()).toBe(true);
  });

  it('should filter languagesAvailable strictly to the active deployment country and exclude global_en duplicate', () => {
    // Default mock deployment is 'mw'
    const languages = component.languagesAvailable();
    expect(languages.length).toBeGreaterThan(0);
    expect(languages.every((l) => l.country_code === 'mw')).toBe(true);
    expect(languages.some((l) => l.id === 'global_en')).toBe(false);
    expect(languages.some((l) => l.id === 'mw_en')).toBe(true);
  });

  it('should mark form and cover_image control dirty when cover image upload completes', () => {
    mockRoles.set(['resources.editor']);
    fixture.detectChanges();

    expect(component.form.pristine).toBe(true);
    expect(component.form.controls.cover_image.pristine).toBe(true);

    const coverUpload = getUploadComponent('resources/covers');
    expect(coverUpload.maxFileSizeMB()).toBe(5);

    coverUpload.handleUploadComplete([
      {
        meta: {
          bucketName: 'mw',
          objectName: 'resources/covers/sample.png',
          cacheControl: 3600,
        },
        data: new File(['mock'], 'sample.png', { type: 'image/png' }),
      },
    ]);

    expect(component.form.controls.cover_image.value).toBe('mw/resources/covers/sample.png');
    expect(component.form.controls.cover_image.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);
    expect(component.form.pristine).toBe(false);
  });

  it('should mark form and cover_image control dirty when selecting or clearing cover image from storage', () => {
    mockRoles.set(['resources.editor']);
    fixture.detectChanges();

    expect(component.form.pristine).toBe(true);

    const coverUpload = getUploadComponent('resources/covers');
    coverUpload.handleStorageFileSelected({
      bucket_id: 'mw',
      name: 'resources/covers/existing.jpg',
      metadata: {} as any,
    });

    expect(component.form.controls.cover_image.value).toBe('mw/resources/covers/existing.jpg');
    expect(component.form.controls.cover_image.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);

    // Clearing cover image
    coverUpload.clearValue();
    expect(component.form.controls.cover_image.value).toBe('');
    expect(component.form.controls.cover_image.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);
  });

  it('should mark form and storage_file control dirty and populate metadata when resource file upload completes', () => {
    mockRoles.set(['resources.editor']);
    fixture.detectChanges();

    expect(component.form.pristine).toBe(true);

    const fileUpload = getUploadComponent('resources');
    fileUpload.handleUploadComplete([
      {
        meta: {
          bucketName: 'mw',
          objectName: 'resources/manual.pdf',
          cacheControl: 3600,
        },
        data: new File(['mock pdf content'], 'manual.pdf', { type: 'application/pdf' }),
      },
    ]);

    expect(component.form.controls.storage_file.value).toBe('mw/resources/manual.pdf');
    expect(component.form.controls.filename.value).toBe('manual.pdf');
    expect(component.form.controls.mimetype.value).toBe('application/pdf');
    expect(component.form.controls.storage_file.dirty).toBe(true);
    expect(component.form.dirty).toBe(true);
  });
});

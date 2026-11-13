import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SupabaseService, SupabaseUploadComponent } from '@picsa/shared/services/core/supabase';

import { DashboardStorageService } from '../../services/storage.service';
import { DashboardStorageUploadComponent } from './storage-upload.component';

describe('DashboardStorageUploadComponent', () => {
  let component: DashboardStorageUploadComponent;
  let fixture: ComponentFixture<DashboardStorageUploadComponent>;

  beforeEach(async () => {
    const mockSupabaseService = {
      // Keep pending so Uppy Dashboard plugin (which has Jest CJS/ESM interop issues) does not mount in unit tests
      ready: () => new Promise(() => undefined),
      config: { apiUrl: 'http://localhost:54321', anonKey: 'test-key' },
      storage: {
        getFile: jest.fn().mockResolvedValue(null),
        getPublicLink: jest.fn((bucket: string, path: string) => `http://localhost/${bucket}/${path}`),
      },
    };

    const mockDashboardStorageService = {
      getStorageFileByPath: jest.fn().mockResolvedValue({
        id: '1',
        bucket_id: 'mw',
        name: 'mw/resources/covers/cover.png',
        publicUrl: 'http://localhost/mw/resources/covers/cover.png',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardStorageUploadComponent],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: DashboardStorageService, useValue: mockDashboardStorageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardStorageUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide dropzone when value is set and restore dropzone when cleared', () => {
    expect(fixture.nativeElement.querySelector('picsa-supabase-upload')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('dashboard-storage-link')).toBeFalsy();

    component.handleUploadComplete([
      {
        data: new File([''], 'cover.png', { type: 'image/png' }),
        meta: { bucketName: 'mw', objectName: 'resources/covers/cover.png', cacheControl: 3600 },
      },
    ]);
    fixture.detectChanges();

    expect(component.value()).toBe('mw/resources/covers/cover.png');
    expect(fixture.nativeElement.querySelector('picsa-supabase-upload')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('dashboard-storage-link')).toBeTruthy();

    component.clearValue();
    fixture.detectChanges();

    expect(component.value()).toBe('');
    expect(fixture.nativeElement.querySelector('dashboard-storage-link')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('picsa-supabase-upload')).toBeTruthy();
  });

  it('should forward maxFileSizeMB to SupabaseUploadComponent and apply cardStyle class', () => {
    const childUploader = fixture.debugElement.query(By.directive(SupabaseUploadComponent))
      .componentInstance as SupabaseUploadComponent;
    expect(childUploader.maxFileSizeMB()).toBe(50);

    fixture.componentRef.setInput('maxFileSizeMB', 5);
    fixture.componentRef.setInput('cardStyle', 'cover');
    fixture.detectChanges();

    expect(childUploader.maxFileSizeMB()).toBe(5);
    expect(fixture.nativeElement.querySelector('.file-card.cover-card')).toBeTruthy();
  });
});

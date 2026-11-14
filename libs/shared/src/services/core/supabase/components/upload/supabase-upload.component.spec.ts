import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupabaseService } from '../../supabase.service';
import { SupabaseUploadComponent } from './supabase-upload.component';

describe('SupabaseUploadComponent', () => {
  let component: SupabaseUploadComponent;
  let fixture: ComponentFixture<SupabaseUploadComponent>;
  let mockSession: { access_token: string } | null = { access_token: 'user-jwt-token' };

  const mockSupabaseService = {
    config: { apiUrl: 'http://localhost:54321', anonKey: 'test-anon-key' },
    ready: () => Promise.resolve(),
    storage: {},
    auth: {
      getClient: Promise.resolve({
        auth: {
          getSession: () => Promise.resolve({ data: { session: mockSession } }),
        },
      }),
    },
  };

  beforeEach(async () => {
    mockSession = { access_token: 'user-jwt-token' };
    await TestBed.configureTestingModule({
      imports: [SupabaseUploadComponent],
      providers: [{ provide: SupabaseService, useValue: mockSupabaseService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SupabaseUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reflect input signals in dashboard options', () => {
    fixture.componentRef.setInput('fileDropHeight', 200);
    fixture.componentRef.setInput('disabled', true);
    expect(component.dashboardOptions().height).toBe(200);
    expect(component.dashboardOptions().disabled).toBe(true);
  });

  it('should default to unrestricted file types with 50MB limit', () => {
    expect(component.fileTypes()).toBeUndefined();
    expect(component.maxFileSizeMB()).toBe(50);
  });

  it('should require an explicit storage bucket instead of defaulting to global', async () => {
    expect(component.storageBucketName()).toBe('');
    await expect(component.startUpload()).rejects.toThrow('storageBucketName');
    fixture.componentRef.setInput('storageBucketName', 'mw');
    expect(component.storageBucketName()).toBe('mw');
  });

  it('should pass authenticated session access_token in Tus auth headers', async () => {
    const headers = await component.getTusAuthHeaders();
    expect(headers).toEqual({
      authorization: 'Bearer user-jwt-token',
      apikey: 'test-anon-key',
    });
  });

  it('should fall back to anonKey in Tus auth headers when no session exists', async () => {
    mockSession = null;
    const headers = await component.getTusAuthHeaders();
    expect(headers).toEqual({
      authorization: 'Bearer test-anon-key',
      apikey: 'test-anon-key',
    });
  });
});

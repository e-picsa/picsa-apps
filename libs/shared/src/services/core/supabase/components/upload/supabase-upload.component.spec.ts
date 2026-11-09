import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupabaseUploadComponent } from './supabase-upload.component';

describe('SupabaseUploadComponent', () => {
  let component: SupabaseUploadComponent;
  let fixture: ComponentFixture<SupabaseUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupabaseUploadComponent],
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
    expect(component.storageBucketName()).toBe('global');
  });
});

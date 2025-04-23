import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupabaseStorageDownloadComponent } from './supabase-storage-download.component';

describe('SupabaseStorageDownloadComponent', () => {
  let component: SupabaseStorageDownloadComponent;
  let fixture: ComponentFixture<SupabaseStorageDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupabaseStorageDownloadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SupabaseStorageDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

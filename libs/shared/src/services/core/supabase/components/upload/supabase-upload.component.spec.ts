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
});

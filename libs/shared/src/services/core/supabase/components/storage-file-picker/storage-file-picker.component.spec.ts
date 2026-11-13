import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupabaseService } from '../../supabase.service';
import { SupabaseStorageFilePickerComponent } from './storage-file-picker.component';

describe('SupabaseStorageFilePickerComponent', () => {
  let component: SupabaseStorageFilePickerComponent;
  let fixture: ComponentFixture<SupabaseStorageFilePickerComponent>;

  beforeEach(async () => {
    const mockSupabaseService = {
      ready: () => Promise.resolve(),
      storage: {
        list: jest.fn().mockResolvedValue([]),
        getPublicLink: jest.fn((bucket: string, path: string) => `http://localhost/${bucket}/${path}`),
      },
    };

    await TestBed.configureTestingModule({
      imports: [SupabaseStorageFilePickerComponent],
      providers: [{ provide: SupabaseService, useValue: mockSupabaseService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SupabaseStorageFilePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

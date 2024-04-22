import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupabaseStoragePickerDirective } from './storage-file-picker.component';

describe('SupabaseStoragePickerDirective', () => {
  let component: SupabaseStoragePickerDirective;
  let fixture: ComponentFixture<SupabaseStoragePickerDirective>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupabaseStoragePickerDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(SupabaseStoragePickerDirective);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

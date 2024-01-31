import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorageFilePickerComponent } from './storage-file-picker.component';

describe('StorageFilePickerComponent', () => {
  let component: StorageFilePickerComponent;
  let fixture: ComponentFixture<StorageFilePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageFilePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StorageFilePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

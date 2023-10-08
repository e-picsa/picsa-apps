import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropDialogComponentComponent } from './crop-dialog-component.component';

describe('CropDialogComponentComponent', () => {
  let component: CropDialogComponentComponent;
  let fixture: ComponentFixture<CropDialogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CropDialogComponentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

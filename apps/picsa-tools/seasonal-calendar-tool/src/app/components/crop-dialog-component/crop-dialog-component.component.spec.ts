import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropDialogComponent } from './crop-dialog-component.component';

describe('CropDialogComponent', () => {
  let component: CropDialogComponent;
  let fixture: ComponentFixture<CropDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CropDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

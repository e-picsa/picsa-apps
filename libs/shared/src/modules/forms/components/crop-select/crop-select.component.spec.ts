import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCropSelectComponent } from './crop-select.component';

describe('CropSelectComponent', () => {
  let component: FormCropSelectComponent;
  let fixture: ComponentFixture<FormCropSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormCropSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormCropSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

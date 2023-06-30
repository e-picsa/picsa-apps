import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropSelectComponent } from './crop-select.component';

describe('CropSelectComponent', () => {
  let component: CropSelectComponent;
  let fixture: ComponentFixture<CropSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CropSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

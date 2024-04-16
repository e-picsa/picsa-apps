import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropVarietyComponent } from './variety.component';

describe('CropVarietyComponent', () => {
  let component: CropVarietyComponent;
  let fixture: ComponentFixture<CropVarietyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropVarietyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropVarietyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

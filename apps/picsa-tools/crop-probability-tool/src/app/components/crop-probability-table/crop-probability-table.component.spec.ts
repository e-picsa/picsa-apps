import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropProbabilityTableComponent } from './crop-probability-table.component';

describe('CropProbabilityTableComponent', () => {
  let component: CropProbabilityTableComponent;
  let fixture: ComponentFixture<CropProbabilityTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CropProbabilityTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropProbabilityTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

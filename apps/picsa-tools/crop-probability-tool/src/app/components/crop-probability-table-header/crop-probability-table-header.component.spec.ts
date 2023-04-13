import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropProbabilityTableHeaderComponent } from './crop-probability-table-header.component';

describe('CropProbabilityTableHeaderComponent', () => {
  let component: CropProbabilityTableHeaderComponent;
  let fixture: ComponentFixture<CropProbabilityTableHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CropProbabilityTableHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropProbabilityTableHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

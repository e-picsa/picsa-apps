import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropProbabilitiesComponent } from './crop-probabilities.component';

describe('CropProbabilitiesComponent', () => {
  let component: CropProbabilitiesComponent;
  let fixture: ComponentFixture<CropProbabilitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropProbabilitiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropProbabilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

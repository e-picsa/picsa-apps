import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbabilityDownscaledComponent } from './probability-downscaled.component';

describe('ProbabilityDownscaledComponent', () => {
  let component: ProbabilityDownscaledComponent;
  let fixture: ComponentFixture<ProbabilityDownscaledComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProbabilityDownscaledComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProbabilityDownscaledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

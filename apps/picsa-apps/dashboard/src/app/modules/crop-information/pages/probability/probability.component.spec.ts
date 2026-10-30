import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CropProbabilityComponent } from './probability.component';

describe('CropProbabilityComponent', () => {
  let component: CropProbabilityComponent;
  let fixture: ComponentFixture<CropProbabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropProbabilityComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CropProbabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

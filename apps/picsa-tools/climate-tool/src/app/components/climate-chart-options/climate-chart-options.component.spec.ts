import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClimateChartOptionsComponent } from './climate-chart-options.component';

describe('ClimateChartOptionsComponent', () => {
  let component: ClimateChartOptionsComponent;
  let fixture: ComponentFixture<ClimateChartOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClimateChartOptionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateChartOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

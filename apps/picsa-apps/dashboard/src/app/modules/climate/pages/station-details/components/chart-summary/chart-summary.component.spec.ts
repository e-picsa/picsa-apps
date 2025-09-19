import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartSummaryComponent } from './chart-summary.component';

describe('ChartSummaryComponent', () => {
  let component: ChartSummaryComponent;
  let fixture: ComponentFixture<ChartSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

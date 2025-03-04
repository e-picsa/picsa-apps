import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForecastViewerComponent } from './forecast-viewer.component';

describe('ForecastViewerComponent', () => {
  let component: ForecastViewerComponent;
  let fixture: ComponentFixture<ForecastViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForecastViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ForecastViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IChartConfig, IChartMeta } from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features/charts/chart';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateChartLayoutComponent } from './chart-layout';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-chart',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockPicsaChartComponent {
  readonly config = input<IChartConfig | Record<string, unknown>>();
  readonly chart = signal(undefined);
}

describe('ClimateChartLayoutComponent', () => {
  let component: ClimateChartLayoutComponent;
  let fixture: ComponentFixture<ClimateChartLayoutComponent>;
  let chartService: ClimateChartService;

  const mockChartMeta: IChartMeta = {
    _id: 'rainfall',
    name: 'Seasonal Rainfall',
    shortname: 'Rain',
    keys: ['Rainfall'],
    colors: ['#000'],
    yFormat: 'value',
    yLabel: 'mm',
    xVar: 'Year',
    xLabel: 'Year',
    units: 'mm',
    definition: 'Annual rainfall definition',
    axes: { yMin: 0, yMax: 1000, xMin: 1980, xMax: 2020, xMinor: 1, xMajor: 5, yMinor: 100, yMajor: 200 },
    tools: {},
    image: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClimateChartLayoutComponent, PicsaTranslateModule.forRoot()],
      providers: [ClimateChartService, { provide: SocialSharing, useValue: {} }],
    })
      .overrideComponent(ClimateChartLayoutComponent, {
        remove: { imports: [PicsaChartComponent] },
        add: { imports: [MockPicsaChartComponent] },
      })
      .compileComponents();

    chartService = TestBed.inject(ClimateChartService);
    fixture = TestBed.createComponent(ClimateChartLayoutComponent);
    fixture.componentRef.setInput('definition', mockChartMeta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should register chart component with chartService on view init', () => {
    expect(chartService.chartComponent()).toBeTruthy();
  });
});

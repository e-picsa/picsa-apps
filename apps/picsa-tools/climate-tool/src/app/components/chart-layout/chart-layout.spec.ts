import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IChartConfig, IChartMeta, IStationData } from '@picsa/models';
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
    definition: '',
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

  describe('Sample Size Guardrail (< 20 Years)', () => {
    it('should report hasInsufficientData as false when dataset is empty', () => {
      chartService.chartData.set([]);
      fixture.detectChanges();

      expect(component.validObservationCount()).toBe(0);
      expect(component.hasInsufficientData()).toBe(false);

      const warningEl = fixture.nativeElement.querySelector('.sample-size-warning');
      expect(warningEl).toBeNull();
    });

    it('should display warning banner when active observations are > 0 and < 20', () => {
      // 10 valid observations
      const mockData: IStationData[] = Array.from({ length: 10 }, (_, i) => ({
        Year: 2000 + i,
        Rainfall: 100 + i * 10,
      })) as unknown as IStationData[];

      chartService.chartDefinition.set(mockChartMeta);
      chartService.chartData.set(mockData);
      fixture.detectChanges();

      expect(component.validObservationCount()).toBe(10);
      expect(component.hasInsufficientData()).toBe(true);

      const warningEl = fixture.nativeElement.querySelector('.sample-size-warning');
      expect(warningEl).not.toBeNull();
      expect(warningEl.textContent).toContain('10');
    });

    it('should hide warning banner when active observations are >= 20', () => {
      // 25 valid observations
      const mockData: IStationData[] = Array.from({ length: 25 }, (_, i) => ({
        Year: 1990 + i,
        Rainfall: 200 + i * 5,
      })) as unknown as IStationData[];

      chartService.chartDefinition.set(mockChartMeta);
      chartService.chartData.set(mockData);
      fixture.detectChanges();

      expect(component.validObservationCount()).toBe(25);
      expect(component.hasInsufficientData()).toBe(false);

      const warningEl = fixture.nativeElement.querySelector('.sample-size-warning');
      expect(warningEl).toBeNull();
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IChartMeta, IStationData } from '@picsa/models';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { TrendlineToolComponent } from './trendline-tool.component';

function createStationRow(year: number, values: Record<string, number | null | undefined>): IStationData {
  return {
    Year: year,
    ...values,
  } as unknown as IStationData;
}

const BASE_AXES: IChartMeta['axes'] = {
  yMin: 0,
  yMax: 1500,
  xMin: 2000,
  xMax: 2009,
  xMinor: 1,
  xMajor: 2,
  yMinor: 100,
  yMajor: 200,
};

describe('TrendlineToolComponent', () => {
  let component: TrendlineToolComponent;
  let fixture: ComponentFixture<TrendlineToolComponent>;
  let chartService: ClimateChartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendlineToolComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    chartService = TestBed.inject(ClimateChartService);
    fixture = TestBed.createComponent(TrendlineToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should plot trendline and omit message when a single series has a strong upward trend', () => {
    const rainfallMeta: IChartMeta = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      shortname: 'Rain',
      keys: ['Rainfall'],
      colors: ['#377eb8'],
      yFormat: 'value',
      yLabel: 'Seasonal Total Rainfall (mm)',
      xLabel: '',
      xVar: 'Year',
      axes: BASE_AXES,
      units: 'mm',
      definition: '',
      image: '',
      tools: {},
    };

    // Strongly trending data (slope = 50, r approx 0.99, p < 0.001)
    const strongTrendData: IStationData[] = [
      createStationRow(2000, { Rainfall: 300 }),
      createStationRow(2001, { Rainfall: 350 }),
      createStationRow(2002, { Rainfall: 410 }),
      createStationRow(2003, { Rainfall: 460 }),
      createStationRow(2004, { Rainfall: 500 }),
      createStationRow(2005, { Rainfall: 550 }),
      createStationRow(2006, { Rainfall: 610 }),
      createStationRow(2007, { Rainfall: 660 }),
      createStationRow(2008, { Rainfall: 700 }),
      createStationRow(2009, { Rainfall: 760 }),
    ];

    chartService.chartDefinition.set(rainfallMeta);
    chartService.chartData.set(strongTrendData);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    expect(trendlines).toBeDefined();
    expect(trendlines?.length).toBe(1);

    const firstLine = trendlines?.[0];
    expect(firstLine?.id).toBe('trendline-Rainfall');
    expect(firstLine?.color).toBe('#377eb8');
    expect(firstLine?.startX).toBe(2000);
    expect(firstLine?.endX).toBe(2009);
    expect(firstLine?.label).toContain('/10y');

    const analyses = component.seriesAnalyses();
    expect(analyses[0].status).toBe('up');
    expect(analyses[0].stats.hasTrend).toBe(true);

    const message = component.getChartMessage();
    expect(message).toBeUndefined();
  });

  it('should plot trendline with negative slope and downward label for strong downward trend', () => {
    const rainfallMeta: IChartMeta = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      shortname: 'Rain',
      keys: ['Rainfall'],
      colors: ['#377eb8'],
      yFormat: 'value',
      yLabel: 'Seasonal Total Rainfall (mm)',
      xLabel: '',
      xVar: 'Year',
      axes: BASE_AXES,
      units: 'mm',
      definition: '',
      image: '',
      tools: {},
    };

    // Strongly downward trending data (slope = -50, r approx -0.99, p < 0.001)
    const downwardTrendData: IStationData[] = [
      createStationRow(2000, { Rainfall: 800 }),
      createStationRow(2001, { Rainfall: 750 }),
      createStationRow(2002, { Rainfall: 690 }),
      createStationRow(2003, { Rainfall: 640 }),
      createStationRow(2004, { Rainfall: 600 }),
      createStationRow(2005, { Rainfall: 550 }),
      createStationRow(2006, { Rainfall: 490 }),
      createStationRow(2007, { Rainfall: 440 }),
      createStationRow(2008, { Rainfall: 400 }),
      createStationRow(2009, { Rainfall: 350 }),
    ];

    chartService.chartDefinition.set(rainfallMeta);
    chartService.chartData.set(downwardTrendData);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(1);

    const firstLine = trendlines?.[0];
    expect(firstLine?.label).toContain('-');

    const analyses = component.seriesAnalyses();
    expect(analyses[0].status).toBe('down');
    expect(analyses[0].stats.slope).toBeLessThan(0);

    const message = component.getChartMessage();
    expect(message).toBeUndefined();
  });

  it('should not plot trendline and show message when no strong trend exists', () => {
    const rainfallMeta: IChartMeta = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      shortname: 'Rain',
      keys: ['Rainfall'],
      colors: ['#377eb8'],
      yFormat: 'value',
      yLabel: 'Seasonal Total Rainfall (mm)',
      xLabel: '',
      xVar: 'Year',
      axes: BASE_AXES,
      units: 'mm',
      definition: '',
      image: '',
      tools: {},
    };

    // Flat fluctuating data (no trend, |r| < 0.3)
    const noTrendData: IStationData[] = [
      createStationRow(2000, { Rainfall: 500 }),
      createStationRow(2001, { Rainfall: 520 }),
      createStationRow(2002, { Rainfall: 480 }),
      createStationRow(2003, { Rainfall: 510 }),
      createStationRow(2004, { Rainfall: 495 }),
      createStationRow(2005, { Rainfall: 505 }),
      createStationRow(2006, { Rainfall: 490 }),
      createStationRow(2007, { Rainfall: 515 }),
      createStationRow(2008, { Rainfall: 485 }),
      createStationRow(2009, { Rainfall: 502 }),
    ];

    chartService.chartDefinition.set(rainfallMeta);
    chartService.chartData.set(noTrendData);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(0);

    const analyses = component.seriesAnalyses();
    expect(analyses[0].status).toBe('none');

    const message = component.getChartMessage();
    expect(message).toBeDefined();
    expect(message?.text).toContain('No strong trend detected');
    expect(message?.subtext).toContain('|r| =');
  });

  it('should show insufficient data message and no trendlines when data has fewer than 3 valid points', () => {
    const rainfallMeta: IChartMeta = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      shortname: 'Rain',
      keys: ['Rainfall'],
      colors: ['#377eb8'],
      yFormat: 'value',
      yLabel: 'Seasonal Total Rainfall (mm)',
      xLabel: '',
      xVar: 'Year',
      axes: BASE_AXES,
      units: 'mm',
      definition: '',
      image: '',
      tools: {},
    };

    // Only 2 points
    const sparseData: IStationData[] = [
      createStationRow(2000, { Rainfall: 500 }),
      createStationRow(2001, { Rainfall: 550 }),
    ];

    chartService.chartDefinition.set(rainfallMeta);
    chartService.chartData.set(sparseData);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(0);

    const analyses = component.seriesAnalyses();
    expect(analyses[0].status).toBe('insufficient');
    expect(analyses[0].decadeText).toBe('—');

    const message = component.getChartMessage();
    expect(message).toBeDefined();
    expect(message?.text).toContain('Insufficient data');
  });

  it('should handle multi-series temperature charts correctly when one series has a trend and another does not', () => {
    const tempMeta: IChartMeta = {
      _id: 'temp_min',
      name: 'Minimum Temperatures',
      shortname: 'Min Temps',
      keys: ['min_tmin', 'mean_tmin'],
      data_labels: {
        min_tmin: 'Lowest minimum daily temp',
        mean_tmin: 'Mean minimum daily temp',
      },
      colors: ['#005b85', '#42c3ff'],
      yFormat: 'value',
      yLabel: 'Temperature (°C)',
      xLabel: '',
      xVar: 'Year',
      axes: {
        ...BASE_AXES,
        yMax: 40,
        yMinor: 1,
        yMajor: 2,
      },
      units: '°C',
      definition: '',
      image: '',
      tools: {},
    };

    // min_tmin has flat fluctuating values (no trend)
    // mean_tmin has clear upward trend
    const mixedData: IStationData[] = [
      createStationRow(2000, { min_tmin: 15.0, mean_tmin: 18.0 }),
      createStationRow(2001, { min_tmin: 15.2, mean_tmin: 18.3 }),
      createStationRow(2002, { min_tmin: 14.9, mean_tmin: 18.7 }),
      createStationRow(2003, { min_tmin: 15.1, mean_tmin: 19.1 }),
      createStationRow(2004, { min_tmin: 15.0, mean_tmin: 19.4 }),
      createStationRow(2005, { min_tmin: 15.3, mean_tmin: 19.8 }),
      createStationRow(2006, { min_tmin: 14.8, mean_tmin: 20.2 }),
      createStationRow(2007, { min_tmin: 15.1, mean_tmin: 20.5 }),
      createStationRow(2008, { min_tmin: 15.0, mean_tmin: 20.9 }),
      createStationRow(2009, { min_tmin: 15.2, mean_tmin: 21.3 }),
    ];

    chartService.chartDefinition.set(tempMeta);
    chartService.chartData.set(mixedData);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    // Only mean_tmin should have a plotted line
    expect(trendlines?.length).toBe(1);
    expect(trendlines?.[0]?.seriesKey).toBe('mean_tmin');
    expect(trendlines?.[0]?.color).toBe('#42c3ff');

    const message = component.getChartMessage();
    expect(message).toBeDefined();
    expect(message?.text).toContain('Lowest minimum daily temp');
  });

  it('should show multi-series fallback message when none of the series meet the trend threshold', () => {
    const tempMeta: IChartMeta = {
      _id: 'temp_min',
      name: 'Minimum Temperatures',
      shortname: 'Min Temps',
      keys: ['min_tmin', 'mean_tmin'],
      data_labels: {
        min_tmin: 'Lowest minimum daily temp',
        mean_tmin: 'Mean minimum daily temp',
      },
      colors: ['#005b85', '#42c3ff'],
      yFormat: 'value',
      yLabel: 'Temperature (°C)',
      xLabel: '',
      xVar: 'Year',
      axes: {
        ...BASE_AXES,
        yMax: 40,
        yMinor: 1,
        yMajor: 2,
      },
      units: '°C',
      definition: '',
      image: '',
      tools: {},
    };

    // Both series fluctuate randomly
    const bothNoTrendData: IStationData[] = [
      createStationRow(2000, { min_tmin: 15.0, mean_tmin: 18.0 }),
      createStationRow(2001, { min_tmin: 15.2, mean_tmin: 17.9 }),
      createStationRow(2002, { min_tmin: 14.9, mean_tmin: 18.2 }),
      createStationRow(2003, { min_tmin: 15.1, mean_tmin: 18.0 }),
      createStationRow(2004, { min_tmin: 15.0, mean_tmin: 18.1 }),
      createStationRow(2005, { min_tmin: 15.3, mean_tmin: 17.8 }),
      createStationRow(2006, { min_tmin: 14.8, mean_tmin: 18.2 }),
      createStationRow(2007, { min_tmin: 15.1, mean_tmin: 18.0 }),
      createStationRow(2008, { min_tmin: 15.0, mean_tmin: 17.9 }),
      createStationRow(2009, { min_tmin: 15.2, mean_tmin: 18.1 }),
    ];

    chartService.chartDefinition.set(tempMeta);
    chartService.chartData.set(bothNoTrendData);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(0);

    const message = component.getChartMessage();
    expect(message).toBeDefined();
    expect(message?.text).toContain('No strong trend detected');
    expect(message?.subtext).toContain('None of the series meet the significance threshold');
  });
});

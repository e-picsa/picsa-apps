import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IChartMeta } from '@picsa/models';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { TrendlineConfigService } from '../../../services/trendline-config.service';
import { TrendlineMethodologyDialogComponent } from './trendline-methodology-dialog.component';
import { TrendlineToolComponent } from './trendline-tool.component';

describe('TrendlineToolComponent', () => {
  let component: TrendlineToolComponent;
  let fixture: ComponentFixture<TrendlineToolComponent>;
  let chartService: ClimateChartService;
  let configService: TrendlineConfigService;
  let dialog: MatDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendlineToolComponent, DecimalPipe, PicsaTranslateModule.forRoot()],
      providers: [ClimateChartService, TrendlineConfigService],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendlineToolComponent);
    component = fixture.componentInstance;
    chartService = TestBed.inject(ClimateChartService);
    configService = TestBed.inject(TrendlineConfigService);
    dialog = TestBed.inject(MatDialog);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.usesPointOverlay).toBe(true);
  });

  it('should update period and sync overlay when setPeriod is called', () => {
    const syncSpy = jest.spyOn(chartService, 'syncPointOverlay');
    component.setPeriod('10_year');
    expect(configService.period()).toBe('10_year');
    expect(syncSpy).toHaveBeenCalled();
  });

  it('should open methodology dialog when openMethodologyDialog is called', () => {
    const openSpy = jest.spyOn(dialog, 'open').mockReturnValue({} as any);
    component.openMethodologyDialog();
    expect(openSpy).toHaveBeenCalledWith(TrendlineMethodologyDialogComponent, {
      width: '540px',
      maxWidth: '92vw',
    });
  });

  it('should analyze single-series chart and plot trendline when trend is statistically clear (p < 0.05)', () => {
    const rainfallMeta: IChartMeta = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      shortname: 'Rain',
      keys: ['Rainfall'],
      units: 'mm',
      xVar: 'Year',
      colors: ['#13599e'],
    };

    // 25 years of strictly increasing data: +10mm each year (clear upward trend)
    const strongUpwardData = Array.from({ length: 25 }, (_, i) => ({
      Year: 1990 + i,
      Rainfall: 500 + i * 10,
    }));

    chartService.chartDefinition.set(rainfallMeta);
    chartService.chartData.set(strongUpwardData);
    fixture.detectChanges();

    const analyses = component.seriesAnalyses();
    expect(analyses.length).toBe(1);
    expect(analyses[0].key).toBe('Rainfall');
    expect(analyses[0].status).toBe('significant_up');
    expect(analyses[0].stats.slope).toBeCloseTo(10, 4);
    expect(analyses[0].stats.changePerDecade).toBeCloseTo(100, 4);
    expect(analyses[0].stats.pValue).toBeLessThan(0.001);
    expect(analyses[0].stats.shouldPlotLine).toBe(true);
    expect(analyses[0].rateLabel).toContain('+100.0 mm / decade');

    // Trendline overlay is generated
    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(1);
    expect(trendlines?.[0].seriesKey).toBe('Rainfall');
    expect(trendlines?.[0].color).toBe('#13599e');
    expect(trendlines?.[0].startX).toBe(1990);
    expect(trendlines?.[0].endX).toBe(2014);

    // Upper chart summary is omitted
    expect(component.getChartMessage()).toBeUndefined();
  });

  it('should handle multi-series charts (e.g. min, mean, max temperature) plotting colored lines for significant series and grey lines for non-significant', () => {
    const tempMeta: IChartMeta = {
      _id: 'temp',
      name: 'Temperature',
      shortname: 'Temp',
      keys: ['min_tmin', 'mean_tmin', 'mean_tmax'],
      data_labels: {
        min_tmin: 'Min Temp',
        mean_tmin: 'Mean Min Temp',
        mean_tmax: 'Mean Max Temp',
      },
      units: '°C',
      xVar: 'Year',
      colors: ['#2b83ba', '#abdda4', '#d7191c'],
    };

    // 25 years: min_tmin and mean_tmin have upward trends; mean_tmax oscillates around 30 without trend
    const multiSeriesData = Array.from({ length: 25 }, (_, i) => ({
      Year: 1990 + i,
      min_tmin: 10 + i * 0.1, // strong upward
      mean_tmin: 15 + i * 0.08, // strong upward
      mean_tmax: 30 + (i % 2 === 0 ? 0.8 : -0.8), // flat oscillating
    }));

    chartService.chartDefinition.set(tempMeta);
    chartService.chartData.set(multiSeriesData);
    fixture.detectChanges();

    const analyses = component.seriesAnalyses();
    expect(analyses.length).toBe(3);

    expect(analyses[0].key).toBe('min_tmin');
    expect(analyses[0].status).toBe('significant_up');
    expect(analyses[0].stats.shouldPlotLine).toBe(true);

    expect(analyses[1].key).toBe('mean_tmin');
    expect(analyses[1].status).toBe('significant_up');
    expect(analyses[1].stats.shouldPlotLine).toBe(true);

    expect(analyses[2].key).toBe('mean_tmax');
    expect(analyses[2].status).toBe('weak_trend');
    expect(analyses[2].stats.shouldPlotLine).toBe(true);

    // All 3 series have trendlines plotted (2 colored, 1 grey for the non-significant series)
    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(3);
    expect(trendlines?.[0].color).toBe('#2b83ba');
    expect(trendlines?.[1].color).toBe('#abdda4');
    expect(trendlines?.[2].color).toBe('#98a2b3'); // grey line
    expect(trendlines?.[2].label).toContain('weak');

    expect(component.getChartMessage()).toBeUndefined();
  });

  it('should plot a grey trendline and show weak trend status when p >= 0.05 and correlation is low', () => {
    const rainfallMeta: IChartMeta = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      shortname: 'Rain',
      keys: ['Rainfall'],
      units: 'mm',
      xVar: 'Year',
    };

    // 25 years of oscillating data around 600mm with zero trend
    const flatData = Array.from({ length: 25 }, (_, i) => ({
      Year: 1990 + i,
      Rainfall: 600 + (i % 2 === 0 ? 40 : -40),
    }));

    chartService.chartDefinition.set(rainfallMeta);
    chartService.chartData.set(flatData);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(1);
    expect(trendlines?.[0].color).toBe('#98a2b3'); // grey line plotted

    const analyses = component.seriesAnalyses();
    expect(analyses[0].status).toBe('weak_trend');
    expect(analyses[0].stats.shouldPlotLine).toBe(true);

    expect(component.getChartMessage()).toBeUndefined();
  });

  it('should not plot a line when record has < 20 observations', () => {
    const rainfallMeta: IChartMeta = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      shortname: 'Rain',
      keys: ['Rainfall'],
      units: 'mm',
      xVar: 'Year',
    };

    // Only 15 observations (< 20 guardrail)
    const shortData = Array.from({ length: 15 }, (_, i) => ({
      Year: 2005 + i,
      Rainfall: 500 + i * 20,
    }));

    chartService.chartDefinition.set(rainfallMeta);
    chartService.chartData.set(shortData);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(0);

    const analyses = component.seriesAnalyses();
    expect(analyses[0].status).toBe('insufficient_data');
    expect(analyses[0].stats.shouldPlotLine).toBe(false);

    expect(component.getChartMessage()).toBeUndefined();
  });

  it('should update analysis when period changes from full to 10-year view', () => {
    const rainfallMeta: IChartMeta = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      shortname: 'Rain',
      keys: ['Rainfall'],
      units: 'mm',
      xVar: 'Year',
    };

    // 40 years of data: flat for first 30 years, strong upward for last 10 years
    const data = [
      ...Array.from({ length: 30 }, (_, i) => ({
        Year: 1985 + i,
        Rainfall: 600 + (i % 2 === 0 ? 5 : -5),
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        Year: 2015 + i,
        Rainfall: 600 + i * 25,
      })),
    ];

    chartService.chartDefinition.set(rainfallMeta);
    chartService.chartData.set(data);
    fixture.detectChanges();

    // In 10-year view, evaluates only the last 10 years (2015-2024)
    configService.setPeriod('10_year');
    fixture.detectChanges();

    const analyses = component.seriesAnalyses();
    expect(analyses[0].stats.n).toBe(10);
    expect(analyses[0].stats.startX).toBe(2015);
    expect(analyses[0].stats.endX).toBe(2024);
    expect(analyses[0].status).toBe('significant_up');
    expect(analyses[0].stats.shouldPlotLine).toBe(true);
  });

  it('should exclude trendline when timespanMode is monthly', () => {
    chartService.setTimespanMode('monthly');
    fixture.detectChanges();

    expect(component.seriesAnalyses().length).toBe(0);
    expect(component.getTrendlines()?.length).toBe(0);
    expect(component.getChartMessage()).toBeUndefined();
  });
});

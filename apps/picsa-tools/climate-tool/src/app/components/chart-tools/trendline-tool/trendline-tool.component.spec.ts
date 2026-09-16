import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IChartMeta, IStationData } from '@picsa/models';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { TrendlineConfigService } from '../../../services/trendline-config.service';
import { TrendlineMethodologyDialogComponent } from './trendline-methodology-dialog.component';
import { TrendlineToolComponent } from './trendline-tool.component';

describe('TrendlineToolComponent', () => {
  let component: TrendlineToolComponent;
  let fixture: ComponentFixture<TrendlineToolComponent>;
  let chartService: ClimateChartService;
  let configService: TrendlineConfigService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendlineToolComponent, DecimalPipe, PicsaTranslateModule.forRoot()],
      providers: [ClimateChartService, TrendlineConfigService, { provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendlineToolComponent);
    component = fixture.componentInstance;
    chartService = TestBed.inject(ClimateChartService);
    configService = TestBed.inject(TrendlineConfigService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.usesPointOverlay).toBe(true);
  });

  it('should update period and sync overlay when setPeriod is called', () => {
    const syncSpy = jest.spyOn(chartService, 'syncPointOverlay');
    component.setPeriod('30_year');
    expect(configService.period()).toBe('30_year');
    expect(syncSpy).toHaveBeenCalled();
  });

  it('should open methodology dialog when openMethodologyDialog is called', () => {
    const openSpy = jest
      .spyOn(component['dialog'], 'open')
      .mockReturnValue({} as MatDialogRef<TrendlineMethodologyDialogComponent>);
    component.openMethodologyDialog();
    expect(openSpy).toHaveBeenCalledWith(TrendlineMethodologyDialogComponent, {
      width: '100%',
      maxWidth: '560px',
      maxHeight: '90vh',
      panelClass: 'no-padding',
      autoFocus: false,
    });
  });

  it('should analyze single-series chart and plot solid trendline when trend is statistically clear (p < 0.05)', () => {
    const rainfallMeta = {
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

    chartService.chartDefinition.set(rainfallMeta as unknown as IChartMeta);
    chartService.chartData.set(strongUpwardData as unknown as IStationData[]);
    fixture.detectChanges();

    const analyses = component.seriesAnalyses();
    expect(analyses.length).toBe(1);
    expect(analyses[0].key).toBe('Rainfall');
    expect(analyses[0].status).toBe('upward_trend');
    expect(analyses[0].stats.slope).toBeCloseTo(10, 4);
    expect(analyses[0].stats.changePerDecade).toBeCloseTo(100, 4);
    expect(analyses[0].stats.pValue).toBeLessThan(0.001);
    expect(analyses[0].stats.shouldPlotLine).toBe(true);
    // Non-temperature rounds to nearest integer
    expect(analyses[0].rateLabel).toContain('+100 mm / decade');
    expect(analyses[0].ciRange).toBe('[+100, +100]');
    expect(analyses[0].ciUnit).toBe('mm / decade');

    // Trendline overlay is generated with solid line
    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(1);
    expect(trendlines?.[0].seriesKey).toBe('Rainfall');
    expect(trendlines?.[0].color).toBe('#13599e');
    expect(trendlines?.[0].startX).toBe(1990);
    expect(trendlines?.[0].endX).toBe(2014);
    expect(trendlines?.[0].strokeWidth).toBe(2.5);

    // Upper chart summary message is omitted
    expect(component.getChartMessage()).toBeUndefined();
  });

  it('should handle multi-series charts by plotting solid colored lines only for significant series and rendering label-only for inconclusive', () => {
    const tempMeta = {
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
      min_tmin: 10 + i * 0.1, // strong upward (+1.0 °C / decade)
      mean_tmin: 15 + i * 0.08, // strong upward (+0.8 °C / decade)
      mean_tmax: 30 + (i % 2 === 0 ? 0.8 : -0.8), // flat oscillating
    }));

    chartService.chartDefinition.set(tempMeta as unknown as IChartMeta);
    chartService.chartData.set(multiSeriesData as unknown as IStationData[]);
    fixture.detectChanges();

    const analyses = component.seriesAnalyses();
    expect(analyses.length).toBe(3);

    // Temperature keeps 1 decimal place
    expect(analyses[0].key).toBe('min_tmin');
    expect(analyses[0].status).toBe('upward_trend');
    expect(analyses[0].stats.shouldPlotLine).toBe(true);
    expect(analyses[0].rateLabel).toContain('+1.0 °C / decade');

    expect(analyses[1].key).toBe('mean_tmin');
    expect(analyses[1].status).toBe('upward_trend');
    expect(analyses[1].stats.shouldPlotLine).toBe(true);
    expect(analyses[1].rateLabel).toContain('+0.8 °C / decade');

    expect(analyses[2].key).toBe('mean_tmax');
    expect(analyses[2].status).toBe('no_clear_trend');
    expect(analyses[2].stats.shouldPlotLine).toBe(false);

    // Only the 2 statistically clear series have lines plotted; inconclusive renders label-only with no line
    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(3);
    expect(trendlines?.[0].color).toBe('#2b83ba');
    expect(trendlines?.[0].labelOnly).toBeFalsy();
    expect(trendlines?.[1].color).toBe('#abdda4');
    expect(trendlines?.[1].labelOnly).toBeFalsy();
    expect(trendlines?.[2].labelOnly).toBe(true);
    expect(trendlines?.[2].label).toBe('No clear trend');

    expect(component.getChartMessage()).toBeUndefined();
  });

  it('should render label-only without line and show no clear trend status when p >= 0.05', () => {
    const rainfallMeta = {
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

    chartService.chartDefinition.set(rainfallMeta as unknown as IChartMeta);
    chartService.chartData.set(flatData as unknown as IStationData[]);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(1);
    expect(trendlines?.[0].labelOnly).toBe(true);
    expect(trendlines?.[0].label).toBe('No clear trend');

    const analyses = component.seriesAnalyses();
    expect(analyses[0].status).toBe('no_clear_trend');
    expect(analyses[0].stats.shouldPlotLine).toBe(false);

    expect(component.getChartMessage()).toBeUndefined();
  });

  it('should render label-only without line when record has < 20 observations', () => {
    const rainfallMeta = {
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

    chartService.chartDefinition.set(rainfallMeta as unknown as IChartMeta);
    chartService.chartData.set(shortData as unknown as IStationData[]);
    fixture.detectChanges();

    const trendlines = component.getTrendlines();
    expect(trendlines?.length).toBe(1);
    expect(trendlines?.[0].labelOnly).toBe(true);
    expect(trendlines?.[0].label).toBe('Insufficient data');

    const analyses = component.seriesAnalyses();
    expect(analyses[0].status).toBe('insufficient_data');
    expect(analyses[0].stats.shouldPlotLine).toBe(false);

    expect(component.getChartMessage()).toBeUndefined();
  });

  it('should update analysis when period changes from full to 30-year view', () => {
    const rainfallMeta = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      shortname: 'Rain',
      keys: ['Rainfall'],
      units: 'mm',
      xVar: 'Year',
    };

    // 50 years of data: flat for first 20 years, strong upward for last 30 years
    const data = [
      ...Array.from({ length: 20 }, (_, i) => ({
        Year: 1975 + i,
        Rainfall: 600 + (i % 2 === 0 ? 5 : -5),
      })),
      ...Array.from({ length: 30 }, (_, i) => ({
        Year: 1995 + i,
        Rainfall: 600 + i * 10,
      })),
    ];

    chartService.chartDefinition.set(rainfallMeta as unknown as IChartMeta);
    chartService.chartData.set(data as unknown as IStationData[]);
    fixture.detectChanges();

    // In 30-year view, evaluates only the last 30 years (1995-2024)
    configService.setPeriod('30_year');
    fixture.detectChanges();

    const analyses = component.seriesAnalyses();
    expect(analyses[0].stats.n).toBe(30);
    expect(analyses[0].stats.startX).toBe(1995);
    expect(analyses[0].stats.endX).toBe(2024);
    expect(analyses[0].status).toBe('upward_trend');
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

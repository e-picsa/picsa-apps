import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateService } from '@picsa/i18n';
import { IChartMeta, IStationData, IStationMeta } from '@picsa/models';
import { PrintProvider } from '@picsa/shared/services/native/print';

import { ClimateChartService } from './climate-chart.service';
import { ClimateDataService } from './climate-data.service';

describe('ClimateChartService', () => {
  let service: ClimateChartService;

  const mockChartMeta: IChartMeta = {
    _id: 'rainfall',
    name: 'Total Rainfall',
    shortname: 'Rainfall',
    image: '',
    keys: ['Rainfall'],
    colors: ['#000'],
    yFormat: 'value',
    yLabel: 'mm',
    xVar: 'Year',
    xLabel: 'Year',
    units: 'mm',
    definition: '',
    axes: {
      yMin: 0,
      yMax: 1000,
      xMin: 1980,
      xMax: 2020,
      xMinor: 1,
      xMajor: 5,
      yMinor: 100,
      yMajor: 200,
    },
    tools: {
      line: { enabled: true, above: { color: 'green' }, below: { color: 'red' } },
      probability: { above: { label: 'above' }, below: { label: 'below' } },
    },
  };

  const mockTempMinMeta: IChartMeta = {
    _id: 'temp_min',
    name: 'Minimum Temperature',
    shortname: 'Min Temp',
    image: '',
    keys: ['min_tmin', 'mean_tmin'],
    colors: ['#00f', '#0ff'],
    yFormat: 'value',
    yLabel: '°C',
    xVar: 'Year',
    xLabel: 'Year',
    units: '°C',
    definition: '',
    axes: {
      yMin: null,
      yMax: null,
      xMin: 1980,
      xMax: 2020,
      xMinor: 1,
      xMajor: 5,
      yMinor: 1,
      yMajor: 2,
    },
    tools: {
      line: { enabled: true, above: { color: 'green' }, below: { color: 'red' } },
      probability: { above: { label: 'above' }, below: { label: 'below' } },
    },
  };

  const mockStation: IStationMeta = {
    id: 'test_station',
    name: 'Test Station',
    latitude: 0,
    longitude: 0,
    countryCode: 'MW',
    location: ['District'],
    definitions: {
      rainfall: mockChartMeta,
      temp_min: mockTempMinMeta,
    } as any,
  };

  const mockData: IStationData[] = [
    {
      Year: 2000,
      Rainfall: 500,
      Start: 0,
      End: 0,
      Length: 0,
      Extreme_events: 0,
      min_tmin: 15,
      mean_tmin: 18,
      mean_tmax: 28,
      max_tmax: 32,
    },
    {
      Year: 2001,
      Rainfall: 600,
      Start: 0,
      End: 0,
      Length: 0,
      Extreme_events: 0,
      min_tmin: 16,
      mean_tmin: 19,
      mean_tmax: 29,
      max_tmax: 33,
    },
  ];

  const mockMonthlyData: any[] = [
    { month: '2000-01', Rainfall: 100, min_tmin: 15, mean_tmin: 18, mean_tmax: 28, max_tmax: 32 },
    { month: '2000-02', Rainfall: 120, min_tmin: 16, mean_tmin: 19, mean_tmax: 29, max_tmax: 33 },
    { month: '2000-03', Rainfall: 80, min_tmin: 14, mean_tmin: 17, mean_tmax: 27, max_tmax: 31 },
    { month: '2001-01', Rainfall: 110, min_tmin: 15.5, mean_tmin: 18.5, mean_tmax: 28.5, max_tmax: 32.5 },
  ];

  let mockDataService: {
    setPreferredStation: jest.Mock;
    getStationMeta: jest.Mock;
    getStationData: jest.Mock;
    getMonthlyStationData: jest.Mock;
    getTimespanData: jest.Mock;
    stations: jest.Mock;
  };

  beforeEach(() => {
    mockDataService = {
      setPreferredStation: jest.fn(),
      getStationMeta: jest.fn().mockResolvedValue(mockStation),
      getStationData: jest.fn().mockResolvedValue(mockData),
      getMonthlyStationData: jest.fn().mockResolvedValue(mockMonthlyData),
      getTimespanData: jest.fn().mockImplementation((_id, mode, month) => {
        if (mode === 'monthly') {
          const monthStr = month.toString().padStart(2, '0');
          return Promise.resolve(mockMonthlyData.filter((d) => d.month.endsWith(`-${monthStr}`)));
        }
        return Promise.resolve(mockData);
      }),
      stations: jest.fn().mockReturnValue([mockStation]),
    };

    TestBed.configureTestingModule({
      providers: [
        ClimateChartService,
        {
          provide: PicsaTranslateService,
          useValue: {
            locale: signal('en'),
            translateText: jest.fn().mockImplementation((t) => Promise.resolve(t)),
            translateArray: jest.fn().mockImplementation((a) => Promise.resolve(a)),
          },
        },
        { provide: SocialSharing, useValue: {} },
        { provide: PrintProvider, useValue: { svgToPngBlob: jest.fn(), shareHtmlDom: jest.fn() } },
        { provide: Router, useValue: { url: '/site/test_station', navigate: jest.fn() } },
        { provide: ClimateDataService, useValue: mockDataService },
      ],
    });

    service = TestBed.inject(ClimateChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should populate availableCharts on setStation and compute chartSeriesData on setChart', async () => {
    await service.setStation('test_station');
    expect(service.availableCharts().length).toBe(2);
    expect(service.availableCharts().map((c) => c._id)).toContain('rainfall');

    await service.setChart('rainfall');
    expect(service.chartData().length).toBe(2);
    expect(service.chartSeriesData()).toEqual([500, 600]);
  });

  it('should configure onrendered callback on chart config', async () => {
    service.station.set(mockStation);

    await service.setChart('rainfall');

    const config = service.chartConfig();
    expect(config).toBeDefined();
    expect(typeof config?.onrendered).toBe('function');

    // Verify calling onrendered updates chartRenderCount signal
    const initialCount = service.chartRenderCount();
    config?.onrendered?.();
    expect(service.chartRenderCount()).toBe(initialCount + 1);
  });

  describe('Timespan Capability Guard & Resolution', () => {
    it('canShowTimespan should return false when station has no monthly capabilities', () => {
      service.station.set(mockStation);
      service.chartDefinition.set(mockChartMeta);
      expect(service.canShowTimespan()).toBe(false);
    });

    it('canShowTimespan should return true only if capabilities.monthly includes current chart id', () => {
      const stationWithMonthly: IStationMeta = {
        ...mockStation,
        capabilities: {
          schemaVersion: 1,
          monthly: ['rainfall'],
        },
      };
      service.station.set(stationWithMonthly);
      service.chartDefinition.set(mockChartMeta);
      expect(service.canShowTimespan()).toBe(true);

      const nonMonthlyDef: IChartMeta = { ...mockChartMeta, _id: 'start' };
      service.chartDefinition.set(nonMonthlyDef);
      expect(service.canShowTimespan()).toBe(false);
    });

    it('should set timespan mode and reload active chart', async () => {
      const stationWithMonthly: IStationMeta = {
        ...mockStation,
        capabilities: {
          schemaVersion: 1,
          monthly: ['rainfall'],
        },
      };
      service.station.set(stationWithMonthly);
      service.chartDefinition.set(mockChartMeta);

      const reloadSpy = jest.spyOn(service, 'reloadActiveChart');
      await service.setTimespanMode('monthly');

      expect(service.timespanMode()).toBe('monthly');
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should cycle months with nextPeriod and previousPeriod in monthly mode', async () => {
      await service.setTimespanMode('monthly');
      service.selectedMonth.set(1);

      await service.nextPeriod();
      expect(service.selectedMonth()).toBe(2);

      service.selectedMonth.set(12);
      await service.nextPeriod();
      expect(service.selectedMonth()).toBe(1);

      await service.previousPeriod();
      expect(service.selectedMonth()).toBe(12);
    });

    it('should load monthly data and append period label in monthly mode', async () => {
      const stationWithMonthly: IStationMeta = {
        ...mockStation,
        countryCode: 'ZM',
        capabilities: {
          schemaVersion: 1,
          monthly: ['rainfall'],
        },
      };
      service.station.set(stationWithMonthly);
      await service.setTimespanMode('monthly');
      await service.setSelectedMonth(1);

      await service.setChart('rainfall');

      expect(mockDataService.getTimespanData).toHaveBeenCalledWith('test_station', 'monthly', 1, undefined);
      expect(service.chartData().length).toBe(2); // 2000-01 and 2001-01
      expect(service.chartDefinition()?.name).toContain('(');
    });

    it('should use annual station data for axes bounds in monthly mode to keep scales stable', async () => {
      const stationWithMonthly: IStationMeta = {
        ...mockStation,
        countryCode: 'ZM',
        capabilities: {
          schemaVersion: 1,
          monthly: ['rainfall'],
        },
      };
      service.station.set(stationWithMonthly);
      await service.setTimespanMode('annual');
      await service.setChart('rainfall');
      const annualYMax = service.chartConfig()?.axis?.y?.max;

      // In monthly mode with lower monthly rainfall values (100, 110)
      await service.setTimespanMode('monthly');
      await service.setSelectedMonth(1);
      await service.setChart('rainfall');

      // The axis max should match the annual yMax, not rescale to 110
      expect(service.chartConfig()?.axis?.y?.max).toBe(annualYMax);
    });

    it('should keep temperature axis scale fixed between annual and monthly modes using annual min/max with 2-degree buffer', async () => {
      const stationWithMonthly: IStationMeta = {
        ...mockStation,
        countryCode: 'ZM',
        capabilities: {
          schemaVersion: 1,
          monthly: ['temp_min'],
        },
      };
      service.station.set(stationWithMonthly);
      await service.setTimespanMode('annual');
      await service.setChart('temp_min');

      // In annual mockData: min_tmin min is 15, mean_tmin max is 19.
      // With 2-degree buffer and yMajor=2:
      // yMin: floor((15 - 2) / 2) * 2 = 12
      // yMax: ceil((19 + 2) / 2) * 2 = 22
      expect(service.chartConfig()?.axis?.y?.min).toBe(12);
      expect(service.chartConfig()?.axis?.y?.max).toBe(22);

      // In monthly mode
      await service.setTimespanMode('monthly');
      await service.setSelectedMonth(1);
      await service.setChart('temp_min');

      // The axis bounds in monthly mode must match the annual bounds exactly
      expect(service.chartConfig()?.axis?.y?.min).toBe(12);
      expect(service.chartConfig()?.axis?.y?.max).toBe(22);
    });
  });
});

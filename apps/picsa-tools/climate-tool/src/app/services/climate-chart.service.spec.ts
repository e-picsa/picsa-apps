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

  const mockStation: IStationMeta = {
    id: 'test_station',
    name: 'Test Station',
    latitude: 0,
    longitude: 0,
    countryCode: 'MW',
    location: ['District'],
    definitions: {
      rainfall: mockChartMeta,
    } as any,
  };

  const mockData: IStationData[] = [
    { Year: 2000, Rainfall: 500, Start: 0, End: 0, Length: 0, Extreme_events: 0 },
    { Year: 2001, Rainfall: 600, Start: 0, End: 0, Length: 0, Extreme_events: 0 },
  ];

  beforeEach(() => {
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
        {
          provide: ClimateDataService,
          useValue: {
            setPreferredStation: jest.fn(),
            getStationMeta: jest.fn().mockResolvedValue(mockStation),
            getStationData: jest.fn().mockResolvedValue(mockData),
            stations: jest.fn().mockReturnValue([mockStation]),
          },
        },
      ],
    });

    service = TestBed.inject(ClimateChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should configure onrendered callback on chart config', async () => {
    service.station.set(mockStation);
    service.stationData.set(mockData);

    await service.setChart('rainfall');

    const config = service.chartConfig();
    expect(config).toBeDefined();
    expect(typeof config?.onrendered).toBe('function');

    // Verify calling onrendered updates chartRenderCount and emits chartRendered$
    let renderedFired = false;
    service.chartRendered$.subscribe(() => {
      renderedFired = true;
    });

    const initialCount = service.chartRenderCount();
    config?.onrendered?.();
    expect(renderedFired).toBe(true);
    expect(service.chartRenderCount()).toBe(initialCount + 1);
  });
});

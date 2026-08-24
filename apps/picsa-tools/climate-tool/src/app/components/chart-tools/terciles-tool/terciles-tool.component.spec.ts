import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IChartMeta } from '@picsa/models';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { TercilesToolComponent } from './terciles-tool.component';

describe('TercilesToolComponent', () => {
  let component: TercilesToolComponent;
  let fixture: ComponentFixture<TercilesToolComponent>;
  let chartService: ClimateChartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TercilesToolComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    chartService = TestBed.inject(ClimateChartService);
    fixture = TestBed.createComponent(TercilesToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render numeric labels for value charts (e.g. Rainfall)', () => {
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
      axes: {
        yMin: 0,
        yMax: 1500,
        xMin: 1980,
        xMax: 2020,
        xMinor: 1,
        xMajor: 2,
        yMinor: 100,
        yMajor: 200,
      },
      units: 'mm',
      definition: '',
      image: '',
      tools: {},
    };

    chartService.chartDefinition.set(rainfallMeta);
    fixture.componentRef.setInput('values', [300, 450, 600, 750, 900, 1100]);
    fixture.detectChanges();

    const lines = component.getOverlayLines();
    expect(lines).toBeDefined();
    expect(lines?.length).toBe(2);

    const lowerLine = lines?.find((l) => l.id === 'tercile-lower');
    const upperLine = lines?.find((l) => l.id === 'tercile-upper');

    expect(lowerLine).toBeDefined();
    expect(upperLine).toBeDefined();
    expect(lowerLine?.label?.text).toMatch(/^Lower = \d+$/);
    expect(upperLine?.label?.text).toMatch(/^Upper = \d+$/);
  });

  it('should render date-formatted labels for start / end of season charts (date-from-July)', () => {
    const startSeasonMeta: IChartMeta = {
      _id: 'start',
      name: 'Start of Season',
      shortname: 'Start',
      keys: ['Start'],
      colors: ['#e41a1c'],
      yFormat: 'date-from-July',
      yLabel: 'Start of Season',
      xLabel: '',
      xVar: 'Year',
      axes: {
        yMin: 0,
        yMax: 365,
        xMin: 1980,
        xMax: 2020,
        xMinor: 1,
        xMajor: 2,
        yMinor: 365 / 48,
        yMajor: 365 / 12,
      },
      units: '',
      definition: '',
      tools: {},
    };

    chartService.chartDefinition.set(startSeasonMeta);
    fixture.componentRef.setInput('values', [120, 130, 140, 150, 160, 170]);
    fixture.detectChanges();

    const lines = component.getOverlayLines();
    expect(lines).toBeDefined();
    expect(lines?.length).toBe(2);

    const lowerLine = lines?.find((l) => l.id === 'tercile-lower');
    const upperLine = lines?.find((l) => l.id === 'tercile-upper');

    expect(lowerLine).toBeDefined();
    expect(upperLine).toBeDefined();
    // Labels should be formatted as dates (e.g. "Lower = 1-Dec" or "Lower = 30-Nov") rather than numeric day offsets
    expect(lowerLine?.label?.text).toMatch(/^Lower = \d{1,2}-[A-Za-z]+$/);
    expect(upperLine?.label?.text).toMatch(/^Upper = \d{1,2}-[A-Za-z]+$/);
  });
});

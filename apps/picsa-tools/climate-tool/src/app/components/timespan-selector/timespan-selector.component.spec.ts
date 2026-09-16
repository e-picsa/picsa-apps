import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PrintProvider } from '@picsa/shared/services/native/print';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateDataService } from '../../services/climate-data.service';
import { TimespanSelectorComponent } from './timespan-selector.component';

describe('TimespanSelectorComponent', () => {
  let component: TimespanSelectorComponent;
  let fixture: ComponentFixture<TimespanSelectorComponent>;
  let chartService: ClimateChartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimespanSelectorComponent, PicsaTranslateModule.forRoot()],
      providers: [
        ClimateChartService,
        { provide: SocialSharing, useValue: {} },
        { provide: PrintProvider, useValue: { svgToPngBlob: jest.fn(), shareHtmlDom: jest.fn() } },
        { provide: Router, useValue: { url: '/site/test_station', navigate: jest.fn() } },
        {
          provide: ClimateDataService,
          useValue: {
            setPreferredStation: jest.fn(),
            getStationMeta: jest.fn().mockResolvedValue(undefined),
            getStationData: jest.fn().mockResolvedValue([]),
            getMonthlyStationData: jest.fn().mockResolvedValue([]),
            stations: jest.fn().mockReturnValue([]),
          },
        },
      ],
    }).compileComponents();

    chartService = TestBed.inject(ClimateChartService);
    fixture = TestBed.createComponent(TimespanSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delegate mode change to chart service', () => {
    const spy = jest.spyOn(chartService, 'setTimespanMode');
    component.onModeChange('monthly');
    expect(spy).toHaveBeenCalledWith('monthly');
  });

  it('should delegate month selection to chart service', () => {
    const spy = jest.spyOn(chartService, 'setSelectedMonth');
    component.onMonthSelect(5);
    expect(spy).toHaveBeenCalledWith(5);
  });

  it('should delegate period selection to chart service', () => {
    const spy = jest.spyOn(chartService, 'setSelectedPeriod');
    const period = { id: 'djf', code: 'DJF', months: [12, 1, 2] as [number, number, number] };
    component.onPeriodSelect(period);
    expect(spy).toHaveBeenCalledWith(period);
  });

  it('should expose only active months (October to June) and render 9 chips in monthly mode', async () => {
    expect(component.months().length).toBe(9);
    const monthIndices = component.months().map((m) => m.index + 1);
    expect(monthIndices).toEqual([10, 11, 12, 1, 2, 3, 4, 5, 6]);
    expect(monthIndices).not.toContain(7); // Jul
    expect(monthIndices).not.toContain(8); // Aug
    expect(monthIndices).not.toContain(9); // Sep

    chartService.station.set({
      id: 'test',
      name: 'Test',
      latitude: 0,
      longitude: 0,
      location: [],
      countryCode: 'zm',
      capabilities: { schemaVersion: 1, monthly: ['rainfall'] },
    } as any);
    chartService.chartDefinition.set({ _id: 'rainfall' } as any);

    await chartService.setTimespanMode('monthly');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const chips = compiled.querySelectorAll('.month-grid .selector-chip');
    expect(chips.length).toBe(9);
  });

  it('should expose all 12 months and render 12 chips in monthly mode for temperature charts', async () => {
    chartService.station.set({
      id: 'test',
      name: 'Test',
      countryCode: 'zm',
      capabilities: { schemaVersion: 1, monthly: ['temp_min'] },
    } as any);
    chartService.chartDefinition.set({ _id: 'temp_min', timespanRange: 'full' } as any);

    await chartService.setTimespanMode('monthly');
    fixture.detectChanges();

    expect(component.months()).toHaveLength(12);
    const compiled = fixture.nativeElement as HTMLElement;
    const chips = compiled.querySelectorAll('.month-grid .selector-chip');
    expect(chips).toHaveLength(12);
  });

  it('should render 12 period chips for temperature charts and 5 period chips for rainfall in three_month mode', async () => {
    chartService.station.set({
      id: 'test',
      name: 'Test',
      countryCode: 'zm',
      capabilities: { schemaVersion: 1, monthly: ['rainfall', 'temp_min'] },
    } as any);

    // 1. Rainfall chart in 3-month mode
    chartService.chartDefinition.set({ _id: 'rainfall' } as any);
    await chartService.setTimespanMode('three_month');
    fixture.detectChanges();

    let chips = (fixture.nativeElement as HTMLElement).querySelectorAll('.period-grid .selector-chip');
    expect(chips).toHaveLength(5);

    // 2. Temperature chart in 3-month mode
    chartService.chartDefinition.set({ _id: 'temp_min', timespanRange: 'full' } as any);
    fixture.detectChanges();

    chips = (fixture.nativeElement as HTMLElement).querySelectorAll('.period-grid .selector-chip');
    expect(chips).toHaveLength(12);
  });
});

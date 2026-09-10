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
});

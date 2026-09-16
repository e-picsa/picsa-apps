import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PrintProvider } from '@picsa/shared/services/native/print';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateDataService } from '../../services/climate-data.service';
import { PeriodNavigatorComponent } from './period-navigator.component';

describe('PeriodNavigatorComponent', () => {
  let component: PeriodNavigatorComponent;
  let fixture: ComponentFixture<PeriodNavigatorComponent>;
  let chartService: ClimateChartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodNavigatorComponent, PicsaTranslateModule.forRoot()],
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
    fixture = TestBed.createComponent(PeriodNavigatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call nextPeriod when next button is clicked', () => {
    const spy = jest.spyOn(chartService, 'nextPeriod');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    // Second button is next
    buttons[1]?.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should call previousPeriod when previous button is clicked', () => {
    const spy = jest.spyOn(chartService, 'previousPeriod');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    // First button is previous
    buttons[0]?.click();
    expect(spy).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { TrendlineConfigService } from '../../../services/trendline-config.service';
import { TrendlineMethodologyDialogComponent } from './trendline-methodology-dialog.component';
import { TrendlineOptionsComponent } from './trendline-options.component';

describe('TrendlineOptionsComponent', () => {
  let component: TrendlineOptionsComponent;
  let fixture: ComponentFixture<TrendlineOptionsComponent>;
  let configService: TrendlineConfigService;
  let syncSpy: jest.Mock;

  beforeEach(async () => {
    syncSpy = jest.fn();

    await TestBed.configureTestingModule({
      imports: [TrendlineOptionsComponent, PicsaTranslateModule.forRoot()],
      providers: [
        TrendlineConfigService,
        {
          provide: ClimateChartService,
          useValue: {
            syncPointOverlay: syncSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendlineOptionsComponent);
    component = fixture.componentInstance;
    configService = TestBed.inject(TrendlineConfigService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update period and sync overlay', () => {
    component.setPeriod('30_year');
    expect(configService.period()).toBe('30_year');
    expect(syncSpy).toHaveBeenCalled();

    component.setPeriod('10_year');
    expect(configService.period()).toBe('10_year');
  });

  it('should open methodology dialog when triggered', () => {
    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    const dialogSpy = jest.spyOn(dialog, 'open').mockReturnValue({} as unknown as MatDialogRef<unknown>);
    component.openMethodologyDialog();
    expect(dialogSpy).toHaveBeenCalledWith(
      TrendlineMethodologyDialogComponent,
      expect.objectContaining({ width: '540px' }),
    );
  });
});

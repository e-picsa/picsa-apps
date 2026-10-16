import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimatePrintLayoutComponent } from './print-layout.component';

if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:test';
}
if (typeof URL.revokeObjectURL === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  URL.revokeObjectURL = () => {};
}

describe('PrintLayoutComponent', () => {
  let component: ClimatePrintLayoutComponent;
  let fixture: ComponentFixture<ClimatePrintLayoutComponent>;
  let chartService: ClimateChartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClimatePrintLayoutComponent, PicsaTranslateModule.forRoot()],
      providers: [ClimateChartService, { provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    chartService = TestBed.inject(ClimateChartService);
    fixture = TestBed.createComponent(ClimatePrintLayoutComponent);
    fixture.componentRef.setInput('chartPngBlob', new Blob());
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reflect currentDefinitionText from chartService for active timespans', () => {
    const mockDef = {
      _id: 'rainfall',
      name: 'Seasonal Rainfall',
      definition: 'Annual rainfall description',
      definitionMonthly: 'Monthly rainfall description',
      definitionThreeMonth: '3-Month rainfall description',
    };
    chartService.chartDefinition.set(mockDef as any);

    chartService.timespanMode.set('annual');
    expect(component.chartDefinitionText()).toBe('Annual rainfall description');

    chartService.timespanMode.set('monthly');
    expect(component.chartDefinitionText()).toBe('Monthly rainfall description');

    chartService.timespanMode.set('three_month');
    expect(component.chartDefinitionText()).toBe('3-Month rainfall description');
  });
});

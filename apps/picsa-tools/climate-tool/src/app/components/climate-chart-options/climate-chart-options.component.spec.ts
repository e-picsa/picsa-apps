import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartOptionsComponent } from './climate-chart-options.component';

describe('ClimateChartOptionsComponent', () => {
  let component: ClimateChartOptionsComponent;
  let fixture: ComponentFixture<ClimateChartOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClimateChartOptionsComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateChartOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

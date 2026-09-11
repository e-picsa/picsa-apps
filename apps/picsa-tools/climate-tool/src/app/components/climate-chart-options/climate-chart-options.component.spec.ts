import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateToolService } from '../../services/climate-tool.service';
import { ClimateShareDialogComponent } from '../share-dialog/share-dialog.component';
import { ClimateChartOptionsComponent } from './climate-chart-options.component';

describe('ClimateChartOptionsComponent', () => {
  let component: ClimateChartOptionsComponent;
  let fixture: ComponentFixture<ClimateChartOptionsComponent>;
  let toolService: ClimateToolService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaTranslateModule.forRoot(), ClimateChartOptionsComponent],
      providers: [SocialSharing],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateChartOptionsComponent);
    component = fixture.componentInstance;
    toolService = TestBed.inject(ClimateToolService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display climate-tool-select and default Tools heading when no tool is active', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('climate-tool-select')).toBeTruthy();
    expect(el.querySelector('.tool-custom-slot')).toBeFalsy();
    expect(el.querySelector('.tools-header h3')).toBeTruthy();
    expect(el.querySelector('.back-btn')).toBeFalsy();
    expect(component.isEnsoToolActive()).toBe(false);
    expect(component.activeToolLabel()).toBe('Tools');
  });

  it('should change heading to tool name and display inline All Tools back button when activeTool is el_nino', () => {
    toolService.activeTool.set('el_nino');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('climate-tool-select')).toBeFalsy();
    expect(el.querySelector('.tool-custom-slot')).toBeTruthy();
    expect(el.querySelector('climate-el-nino-tool')).toBeTruthy();

    const backBtn = el.querySelector('.tools-header .back-btn') as HTMLButtonElement;
    expect(backBtn).toBeTruthy();
    expect(backBtn.querySelector('mat-icon')?.textContent).toContain('arrow_back');
    expect(component.isEnsoToolActive()).toBe(true);
    expect(component.activeToolLabel()).toBe('El Niño');
    expect(el.querySelector('.tools-header .tool-title')?.textContent).toContain('El Niño');
  });

  it('should display custom slot and La Nina tool heading when activeTool is la_nina', () => {
    toolService.activeTool.set('la_nina');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.tool-custom-slot')).toBeTruthy();
    expect(el.querySelector('climate-la-nina-tool')).toBeTruthy();
    expect(component.isEnsoToolActive()).toBe(true);
    expect(component.activeToolLabel()).toBe('La Niña');
    expect(el.querySelector('.tools-header .tool-title')?.textContent).toContain('La Niña');
  });

  it('should disable tool and return to all tools when closeToolCustomisation is called', () => {
    toolService.activeTool.set('el_nino');
    fixture.detectChanges();

    component.closeToolCustomisation();
    fixture.detectChanges();

    expect(toolService.activeTool()).toBeUndefined();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('climate-tool-select')).toBeTruthy();
    expect(el.querySelector('.tool-custom-slot')).toBeFalsy();
    expect(component.isEnsoToolActive()).toBe(false);
    expect(component.activeToolLabel()).toBe('Tools');
  });

  it('should render Share Image button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const shareBtn = el.querySelector('.share-btn') as HTMLButtonElement;
    expect(shareBtn).toBeTruthy();
    expect(shareBtn.querySelector('mat-icon')?.textContent).toContain('share');
    const headings = Array.from(el.querySelectorAll('h3'));
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });

  it('should open share dialog when showShareDialog is invoked', async () => {
    const dialogSpy = jest.spyOn(component['dialog'], 'open').mockReturnValue({} as any);
    await component.showShareDialog();
    expect(dialogSpy).toHaveBeenCalledWith(ClimateShareDialogComponent, { disableClose: true });
  });
});

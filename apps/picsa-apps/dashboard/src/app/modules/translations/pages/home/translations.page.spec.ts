import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationsPageComponent } from './translations.page';

describe('TranslationsPageComponent', () => {
  let component: TranslationsPageComponent;
  let fixture: ComponentFixture<TranslationsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslationsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service.exportXlsx when download template button is clicked', () => {
    const exportSpy = jest.spyOn(component.service, 'exportXlsx').mockResolvedValue(undefined as never);
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const downloadBtn = Array.from(buttons).find((btn) =>
      (btn as HTMLButtonElement).textContent?.includes('Download Template'),
    ) as HTMLButtonElement;

    expect(downloadBtn).toBeTruthy();
    downloadBtn.click();
    expect(exportSpy).toHaveBeenCalled();
  });

  it('should configure tool column filter and scope chip counts by active columnFilters', () => {
    component.locale.set('mw_ny');
    component.service.translations.set([
      { id: '1', tool: 'budget', text: 'A', mw_ny: 'A_ny', archived: null } as any,
      { id: '2', tool: 'budget', text: 'B', mw_ny: null, archived: null } as any,
      { id: '3', tool: 'climate', text: 'C', mw_ny: 'C_ny', archived: null } as any,
    ]);
    fixture.detectChanges();

    expect(component.tableOptions().filterColumns).toEqual(['tool']);
    expect(component.countTotal).toBe(3);
    expect(component.countTranslated).toBe(2);
    expect(component.countPending).toBe(1);

    component.columnFilters.set({ tool: 'budget' });
    fixture.detectChanges();

    expect(component.countTotal).toBe(2);
    expect(component.countTranslated).toBe(1);
    expect(component.countPending).toBe(1);
    expect(component.hasTranslations()).toBe(true);
  });
});

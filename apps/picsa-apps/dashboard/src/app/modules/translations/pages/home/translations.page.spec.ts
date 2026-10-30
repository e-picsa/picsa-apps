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
});

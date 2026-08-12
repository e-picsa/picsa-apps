import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ToolSelectComponent } from './tool-select.component';

describe('ToolSelectComponent', () => {
  let component: ToolSelectComponent;
  let fixture: ComponentFixture<ToolSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolSelectComponent, PicsaTranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

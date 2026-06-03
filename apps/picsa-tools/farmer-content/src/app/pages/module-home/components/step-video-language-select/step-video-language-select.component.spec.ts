import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepVideoLanguageSelectComponent } from './step-video-language-select.component';

describe('StepVideoLanguageSelectComponent', () => {
  let component: StepVideoLanguageSelectComponent;
  let fixture: ComponentFixture<StepVideoLanguageSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepVideoLanguageSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepVideoLanguageSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

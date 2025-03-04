import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepVideoComponent } from './step-video.component';

describe('StepVideoComponent', () => {
  let component: StepVideoComponent;
  let fixture: ComponentFixture<StepVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepVideoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

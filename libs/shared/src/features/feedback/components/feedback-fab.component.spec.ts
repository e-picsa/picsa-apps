import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackFabComponent } from './feedback-fab.component';

describe('FeedbackFabComponent', () => {
  let component: FeedbackFabComponent;
  let fixture: ComponentFixture<FeedbackFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackFabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

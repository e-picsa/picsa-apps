import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackService } from '../../../services/core/feedback/feedback.service';
import { FeedbackFabComponent } from './feedback-fab.component';

describe('FeedbackFabComponent', () => {
  let component: FeedbackFabComponent;
  let fixture: ComponentFixture<FeedbackFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackFabComponent],
      providers: [{ provide: FeedbackService, useValue: { ready: jest.fn().mockResolvedValue(undefined) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

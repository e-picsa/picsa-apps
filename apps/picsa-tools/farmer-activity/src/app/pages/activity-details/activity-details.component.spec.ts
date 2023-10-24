import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityDetailsComponent } from './activity-details.component';

describe('step-details', () => {
  let component: ActivityDetailsComponent;
  let fixture: ComponentFixture<ActivityDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivityDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

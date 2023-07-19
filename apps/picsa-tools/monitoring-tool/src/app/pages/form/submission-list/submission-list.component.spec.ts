import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionListComponent } from './submission-list.component';

describe('SubmissionListComponent', () => {
  let component: SubmissionListComponent;
  let fixture: ComponentFixture<SubmissionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SubmissionListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

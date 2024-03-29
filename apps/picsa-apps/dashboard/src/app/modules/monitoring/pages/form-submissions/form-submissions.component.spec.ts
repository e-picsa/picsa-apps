import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSubmissionsComponent } from './form-submissions.component';

describe('FormSubmissionsComponent', () => {
  let component: FormSubmissionsComponent;
  let fixture: ComponentFixture<FormSubmissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSubmissionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormSubmissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

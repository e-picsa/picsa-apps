import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldErrorDisplayComponent } from './field-error-display.component';

describe('FieldErrorDisplayComponent', () => {
  let component: FieldErrorDisplayComponent;
  let fixture: ComponentFixture<FieldErrorDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldErrorDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FieldErrorDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

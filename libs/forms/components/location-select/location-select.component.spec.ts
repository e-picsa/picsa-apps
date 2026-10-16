import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormLocationSelectComponent } from './location-select.component';

describe('FormLocationSelectComponent', () => {
  let component: FormLocationSelectComponent;
  let fixture: ComponentFixture<FormLocationSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormLocationSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormLocationSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('countryCode', 'zm');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

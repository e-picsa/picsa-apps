import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormItemComponent } from './form-item.component';

describe('FormListComponent', () => {
  let component: FormItemComponent;
  let fixture: ComponentFixture<FormItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

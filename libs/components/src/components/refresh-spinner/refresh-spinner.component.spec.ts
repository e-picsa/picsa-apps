import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefreshSpinnerComponent } from './refresh-spinner.component';

describe('RefreshSpinnerComponent', () => {
  let component: RefreshSpinnerComponent;
  let fixture: ComponentFixture<RefreshSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefreshSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RefreshSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthDialogComponent } from './crop-dialog-component.component';

describe('MonthDialogComponent', () => {
  let component: MonthDialogComponent;
  let fixture: ComponentFixture<MonthDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonthDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualSelectComponent } from './manual-select.component';

describe('ManualSelectComponent', () => {
  let component: ManualSelectComponent;
  let fixture: ComponentFixture<ManualSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManualSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

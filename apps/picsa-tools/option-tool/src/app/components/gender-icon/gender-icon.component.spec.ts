import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenderIconComponent } from './gender-icon.component';

describe('GenderIconComponent', () => {
  let component: GenderIconComponent;
  let fixture: ComponentFixture<GenderIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenderIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GenderIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

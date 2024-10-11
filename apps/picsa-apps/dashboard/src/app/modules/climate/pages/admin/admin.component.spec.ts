import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClimateAdminPageComponent } from './admin.component';

describe('ClimateAdminPageComponent', () => {
  let component: ClimateAdminPageComponent;
  let fixture: ComponentFixture<ClimateAdminPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClimateAdminPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

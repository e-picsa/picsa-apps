import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCropAdminComponent } from './admin.component';

describe('DashboardCropAdminComponent', () => {
  let component: DashboardCropAdminComponent;
  let fixture: ComponentFixture<DashboardCropAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCropAdminComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCropAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

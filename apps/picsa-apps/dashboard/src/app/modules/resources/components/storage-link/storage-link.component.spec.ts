import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardResourcesStorageLinkComponent } from './storage-link.component';

describe('StorageLinkComponent', () => {
  let component: DashboardResourcesStorageLinkComponent;
  let fixture: ComponentFixture<DashboardResourcesStorageLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardResourcesStorageLinkComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardResourcesStorageLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

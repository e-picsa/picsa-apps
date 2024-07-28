import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardStorageLinkComponent } from './storage-link.component';

describe('StorageLinkComponent', () => {
  let component: DashboardStorageLinkComponent;
  let fixture: ComponentFixture<DashboardStorageLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardStorageLinkComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardStorageLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

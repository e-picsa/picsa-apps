import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitoringPageComponent } from './monitoring.page';

describe('MonitoringPageComponent', () => {
  let component: MonitoringPageComponent;
  let fixture: ComponentFixture<MonitoringPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoringPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoringPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

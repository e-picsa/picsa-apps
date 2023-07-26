import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceTroubleshooterComponent } from './device-troubleshooter.component';

describe('DeviceTroubleshooterComponent', () => {
  let component: DeviceTroubleshooterComponent;
  let fixture: ComponentFixture<DeviceTroubleshooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeviceTroubleshooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceTroubleshooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

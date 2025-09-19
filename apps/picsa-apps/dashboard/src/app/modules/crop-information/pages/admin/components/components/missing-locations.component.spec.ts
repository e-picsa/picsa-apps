import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissingLocationsComponent } from './missing-locations.component';

describe('MissingLocationsComponent', () => {
  let component: MissingLocationsComponent;
  let fixture: ComponentFixture<MissingLocationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissingLocationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MissingLocationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

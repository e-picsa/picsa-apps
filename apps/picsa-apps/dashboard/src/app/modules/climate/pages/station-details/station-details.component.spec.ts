import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StationDetailsPageComponent } from './station-details.component';

describe('StationDetailsPageComponent', () => {
  let component: StationDetailsPageComponent;
  let fixture: ComponentFixture<StationDetailsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StationDetailsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StationDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

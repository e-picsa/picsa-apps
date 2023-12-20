import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClimateDataHomeComponent } from './climate-data-home.component';

describe('ClimateDataHomeComponent', () => {
  let component: ClimateDataHomeComponent;
  let fixture: ComponentFixture<ClimateDataHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClimateDataHomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateDataHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

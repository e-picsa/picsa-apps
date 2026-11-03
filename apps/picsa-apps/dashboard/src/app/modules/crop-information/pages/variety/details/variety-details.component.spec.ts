import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CropVarietyDetailsComponent } from './variety-details.component';

describe('CropVarietyDetailsComponent', () => {
  let component: CropVarietyDetailsComponent;
  let fixture: ComponentFixture<CropVarietyDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropVarietyDetailsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CropVarietyDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

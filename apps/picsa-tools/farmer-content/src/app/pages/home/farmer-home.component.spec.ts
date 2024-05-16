import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmerContentHomeComponent } from './farmer-home.component';

describe('FarmerHomeComponent', () => {
  let component: FarmerContentHomeComponent;
  let fixture: ComponentFixture<FarmerContentHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerContentHomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerContentHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

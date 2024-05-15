import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicsaFarmerHomeComponent } from './farmer-home.component';

describe('FarmerHomeComponent', () => {
  let component: PicsaFarmerHomeComponent;
  let fixture: ComponentFixture<PicsaFarmerHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaFarmerHomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaFarmerHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

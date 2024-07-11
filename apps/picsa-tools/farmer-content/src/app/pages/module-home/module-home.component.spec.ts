import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmerContentModuleHomeComponent } from './module-home.component';

describe('FarmerContentModuleHomeComponent', () => {
  let component: FarmerContentModuleHomeComponent;
  let fixture: ComponentFixture<FarmerContentModuleHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerContentModuleHomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerContentModuleHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

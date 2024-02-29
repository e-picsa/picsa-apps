import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeploymentSelectComponent } from './deployment-select.component';

describe('DeploymentSelectComponent', () => {
  let component: DeploymentSelectComponent;
  let fixture: ComponentFixture<DeploymentSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeploymentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

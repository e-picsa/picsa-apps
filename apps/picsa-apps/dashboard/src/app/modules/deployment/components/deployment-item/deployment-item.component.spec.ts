import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeploymentItemComponent } from './deployment-item.component';

describe('DeploymentItemComponent', () => {
  let component: DeploymentItemComponent;
  let fixture: ComponentFixture<DeploymentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeploymentItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeploymentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

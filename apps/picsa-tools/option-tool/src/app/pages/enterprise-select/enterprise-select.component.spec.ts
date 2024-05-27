import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnterpriseSelectComponent } from './enterprise-select.component';

describe('EnterpriseSelectComponent', () => {
  let component: EnterpriseSelectComponent;
  let fixture: ComponentFixture<EnterpriseSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterpriseSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterpriseSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

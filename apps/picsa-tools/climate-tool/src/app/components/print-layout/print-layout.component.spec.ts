import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClimatePrintLayoutComponent } from './print-layout.component';

describe('PrintLayoutComponent', () => {
  let component: ClimatePrintLayoutComponent;
  let fixture: ComponentFixture<ClimatePrintLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClimatePrintLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimatePrintLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

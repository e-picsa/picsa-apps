import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClimateDashboardDataGridComponent } from './data-grid.component';

describe('DataGridComponent', () => {
  let component: ClimateDashboardDataGridComponent;
  let fixture: ComponentFixture<ClimateDashboardDataGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClimateDashboardDataGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateDashboardDataGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

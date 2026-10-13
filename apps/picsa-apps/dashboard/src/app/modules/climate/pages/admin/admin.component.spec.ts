import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ClimateService } from '../../climate.service';
import { ClimateAdminPageComponent } from './admin.component';

describe('ClimateAdminPageComponent', () => {
  let component: ClimateAdminPageComponent;
  let fixture: ComponentFixture<ClimateAdminPageComponent>;
  let mockClimateService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockClimateService = {
      stations: jest.fn().mockReturnValue([]),
      apiCountryCode: 'mw',
      getAllStationData: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
      getAllStationsAppData: jest.fn().mockReturnValue(Promise.resolve({})),
      getStationData: jest.fn().mockReturnValue(Promise.resolve({ data: null })),
      updateStationDataFromApi: jest.fn().mockReturnValue(of({ status: 'fulfilled' })),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    mockActivatedRoute = {
      snapshot: { params: {} },
    };

    await TestBed.configureTestingModule({
      imports: [ClimateAdminPageComponent],
      providers: [
        { provide: ClimateService, useValue: mockClimateService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should configure DB table options with consolidated QC status and details', () => {
    expect(component.dbTableOptions.displayColumns).toContain('name');
    expect(component.dbTableOptions.displayColumns).toContain('rainfall_total_years');
    expect(component.dbTableOptions.displayColumns).toContain('rainfall_last_ten_years');
    expect(component.dbTableOptions.displayColumns).toContain('qc_passed');
    expect(component.dbTableOptions.displayColumns).toContain('qc_details');
    expect(component.dbTableOptions.displayColumns).toContain('products');
    expect(component.dbTableOptions.displayColumns).toContain('updated_at');
    expect(component.dbTableOptions.displayColumns).toContain('rainfall_export_data');

    expect(component.dbTableOptions.formatHeader('name')).toBe('Station');
    expect(component.dbTableOptions.formatHeader('rainfall_total_years')).toBe('Total Years');
    expect(component.dbTableOptions.formatHeader('rainfall_last_ten_years')).toBe('Past 10 Years');
    expect(component.dbTableOptions.formatHeader('qc_passed')).toBe('QC Status');
    expect(component.dbTableOptions.formatHeader('qc_details')).toBe('QC Details');
    expect(component.dbTableOptions.formatHeader('products')).toBe('Available Products');
    expect(component.dbTableOptions.formatHeader('updated_at')).toBe('Last Sync');
    expect(component.dbTableOptions.formatHeader('rainfall_export_data')).toBe('Action');
  });

  it('should support filtering DB table by QC status and warnings', () => {
    expect(component.dbQcFilter()).toBe('all');
    component.setDbQcFilter('passed');
    expect(component.dbQcFilter()).toBe('passed');
    // toggling same filter returns to all
    component.setDbQcFilter('passed');
    expect(component.dbQcFilter()).toBe('all');

    component.setDbQcFilter('failed');
    expect(component.dbQcFilter()).toBe('failed');
    component.setDbQcFilter('warnings');
    expect(component.dbQcFilter()).toBe('warnings');
  });

  it('should configure App Bundled table options', () => {
    expect(component.appTableOptions.displayColumns).toContain('name');
    expect(component.appTableOptions.displayColumns).toContain('has_bundled_data');
    expect(component.appTableOptions.displayColumns).toContain('total_years');
    expect(component.appTableOptions.displayColumns).toContain('products');
    expect(component.appTableOptions.formatHeader('name')).toBe('Station');
    expect(component.appTableOptions.formatHeader('has_bundled_data')).toBe('Bundled Status');
  });

  it('should configure Diff table options including QC status', () => {
    expect(component.diffTableOptions.displayColumns).toContain('name');
    expect(component.diffTableOptions.displayColumns).toContain('diff_status');
    expect(component.diffTableOptions.displayColumns).toContain('qc_passed');
    expect(component.diffTableOptions.displayColumns).toContain('app_years_count');
    expect(component.diffTableOptions.displayColumns).toContain('db_years_count');
    expect(component.diffTableOptions.displayColumns).toContain('updated_at');
    expect(component.diffTableOptions.displayColumns).toContain('diff');
  });
});

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

  it('should configure DB table options with consolidated QC status, year counters and warnings', () => {
    expect(component.dbTableOptions.displayColumns).toEqual([
      'name',
      'qc_passed',
      'rainfall_total_years',
      'rainfall_last_thirty_years',
      'rainfall_last_ten_years',
      'qc_warnings',
      'products',
      'updated_at',
    ]);

    expect(component.dbTableOptions.formatHeader('name')).toBe('Station');
    expect(component.dbTableOptions.formatHeader('qc_passed')).toBe('QC Status');
    expect(component.dbTableOptions.formatHeader('rainfall_total_years')).toBe('Total Years');
    expect(component.dbTableOptions.formatHeader('rainfall_last_thirty_years')).toBe('Past 30 Years');
    expect(component.dbTableOptions.formatHeader('rainfall_last_ten_years')).toBe('Past 10 Years');
    expect(component.dbTableOptions.formatHeader('qc_warnings')).toBe('Warnings');
    expect(component.dbTableOptions.formatHeader('products')).toBe('Available Products');
    expect(component.dbTableOptions.formatHeader('updated_at')).toBe('Last Sync');
  });

  it('should open station details dialog on row click', () => {
    const dialogSpy = jest.spyOn((component as any).dialog, 'open').mockReturnValue({} as any);
    const mockStation = { id: 's1', station_id: 's1', station_name: 'Test' };
    component.openStationDetailsDialog(mockStation as any);
    expect(dialogSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: { station: mockStation },
      }),
    );
  });

  it('should format QC status tooltip and warning lines correctly', () => {
    const passedRow: any = { qc_passed: true };
    const passedTooltip = component.getQcStatusTooltip(passedRow);
    expect(passedTooltip).toContain('Quality Control: Passed');
    expect(passedTooltip).toContain('Total rainfall record ≥ 30 years');

    const failedRow: any = {
      qc_passed: false,
      qc_reasons: ['Insufficient rainfall record (< 30 years)'],
    };
    const failedTooltip = component.getQcStatusTooltip(failedRow);
    expect(failedTooltip).toContain('Quality Control: Failed');
    expect(failedTooltip).toContain('Insufficient rainfall record (< 30 years)');

    const warningRow: any = { qc_season_warning: '2 years with start but no end' };
    expect(component.getWarningLines(warningRow)).toEqual(['2 years with start but no end']);
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

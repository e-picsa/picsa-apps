import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { ClimateAdminPageComponent } from './admin.component';
import { StationDiffDialogComponent } from './components/station-diff-dialog/station-diff-dialog.component';

describe('ClimateAdminPageComponent', () => {
  let component: ClimateAdminPageComponent;
  let fixture: ComponentFixture<ClimateAdminPageComponent>;
  let mockDialog: { open: jest.Mock };

  beforeEach(async () => {
    mockDialog = { open: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ClimateAdminPageComponent],
      providers: [provideRouter([]), provideNoopAnimations(), { provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should configure DB table options without diff column', () => {
    expect(component.dbTableOptions.displayColumns).toContain('updated_at');
    expect(component.dbTableOptions.displayColumns).toContain('rainfall_export_data');
    expect(component.dbTableOptions.displayColumns).not.toContain('app_data_diff');
  });

  it('should configure App Bundled table options', () => {
    expect(component.appTableOptions.displayColumns).toContain('has_bundled_data');
    expect(component.appTableOptions.displayColumns).toContain('total_years');
    expect(component.appTableOptions.displayColumns).toContain('products');
    expect(component.appTableOptions.formatHeader('has_bundled_data')).toBe('Bundled CSV');
  });

  it('should configure Diff table options', () => {
    expect(component.diffTableOptions.displayColumns).toContain('diff_status');
    expect(component.diffTableOptions.displayColumns).toContain('years_added');
    expect(component.diffTableOptions.displayColumns).toContain('years_removed');
    expect(component.diffTableOptions.displayColumns).toContain('values_changed');
    expect(component.diffTableOptions.displayColumns).toContain('actions');
    expect(component.diffTableOptions.formatHeader('diff_status')).toBe('Status');
  });

  it('should filter diffTableData when showOnlyDiffs is toggled', () => {
    expect(component.showOnlyDiffs()).toBe(false);
    component.showOnlyDiffs.set(true);
    expect(component.showOnlyDiffs()).toBe(true);
  });

  it('should format getDiffTooltip accurately based on diff status', () => {
    const inSyncTooltip = component.getDiffTooltip({
      status: 'in_sync',
      totalYearsAddedCount: 0,
      totalYearsRemovedCount: 0,
      totalChangedValuesCount: 0,
      products: {},
      hasAppData: true,
      hasDbData: true,
      stationId: 'st_1',
    });
    expect(inSyncTooltip).toContain('identical');

    const diffTooltip = component.getDiffTooltip({
      status: 'diff',
      totalYearsAddedCount: 2,
      totalYearsRemovedCount: 1,
      totalChangedValuesCount: 3,
      products: {
        rainfall: {
          productId: 'rainfall',
          label: 'Rainfall',
          units: 'mm',
          yearsAdded: [2021, 2022],
          yearsRemoved: [1980],
          changedCount: 1,
          changes: [],
          appYearSpan: [1980, 2020],
          dbYearSpan: [1981, 2022],
          hasData: true,
          isInSync: false,
        },
      },
      hasAppData: true,
      hasDbData: true,
      stationId: 'st_1',
    });
    expect(diffTooltip).toContain('+2 added');
    expect(diffTooltip).toContain('-1 removed');
    expect(diffTooltip).toContain('~3 changed');
    expect(diffTooltip).toContain('Rainfall: +2 yrs, -1 yrs, ~1 changed');
  });

  it('should open StationDiffDialogComponent when openStationDiffDialog is called', () => {
    const mockStation: any = { id: 'salima', station_id: 'salima', station_name: 'Salima' };
    const mockEvent = {
      preventDefault: jest.fn(),
      stopImmediatePropagation: jest.fn(),
    } as any;

    component.openStationDiffDialog(mockStation, mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
    expect(mockDialog.open).toHaveBeenCalledWith(
      StationDiffDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          station: mockStation,
        }),
        panelClass: 'no-padding',
        autoFocus: false,
      }),
    );
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { compareStationDatasets } from '../../../../climate-diff.utils';
import { IStationDiffDialogData, StationDiffDialogComponent } from './station-diff-dialog.component';

describe('StationDiffDialogComponent', () => {
  let component: StationDiffDialogComponent;
  let fixture: ComponentFixture<StationDiffDialogComponent>;
  const mockDialogRef = { close: jest.fn() };

  const mockData: IStationDiffDialogData = {
    station: {
      id: 'station_1',
      station_id: 'station_1',
      station_name: 'Test Station',
      country_code: 'MW',
    } as any,
    appData: [
      { Year: 1990, Rainfall: 800 },
      { Year: 1991, Rainfall: 850 },
    ],
    dbData: [
      { Year: 1990, Rainfall: 800 },
      { Year: 1991, Rainfall: 900 },
      { Year: 1992, Rainfall: 750 },
    ],
    diffSummary: compareStationDatasets(
      'station_1',
      [
        { Year: 1990, Rainfall: 800 },
        { Year: 1991, Rainfall: 850 },
      ],
      [
        { Year: 1990, Rainfall: 800 },
        { Year: 1991, Rainfall: 900 },
        { Year: 1992, Rainfall: 750 },
      ],
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StationDiffDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StationDiffDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize with first diff product', () => {
    expect(component).toBeTruthy();
    expect(component.selectedProductId()).toBe('rainfall');
    expect(component.chartConfig()).toBeDefined();
  });

  it('should switch selected product when selectProduct is called', () => {
    component.selectProduct('length');
    expect(component.selectedProductId()).toBe('length');
    expect(component.selectedProduct().id).toBe('length');
  });

  it('should close dialog when close() is called', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});

import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import type { IChartConfig } from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features';
import { of } from 'rxjs';

import { compareStationDatasets } from '../../../../climate-diff.utils';
import { IStationDiffDialogData, StationDiffDialogComponent } from './station-diff-dialog.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'picsa-chart',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockPicsaChartComponent {
  readonly config = input<IChartConfig | Record<string, unknown>>();
  readonly chart = signal({ resize: jest.fn() } as any);
}

describe('StationDiffDialogComponent', () => {
  let component: StationDiffDialogComponent;
  let fixture: ComponentFixture<StationDiffDialogComponent>;
  const mockDialogRef = {
    close: jest.fn(),
    afterOpened: jest.fn(() => of(undefined)),
  };

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
    })
      .overrideComponent(StationDiffDialogComponent, {
        remove: { imports: [PicsaChartComponent] },
        add: { imports: [MockPicsaChartComponent] },
      })
      .compileComponents();

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

  it('should render colored diff boxes for divergent products and omit top-level summary stats', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.product-diff-boxes')).toBeTruthy();
    expect(el.querySelector('.diff-box.box-added')).toBeTruthy();
    expect(el.querySelector('.diff-box.box-removed')).toBeTruthy();
    expect(el.querySelector('.diff-box.box-changed')).toBeTruthy();
    expect(el.textContent).not.toContain('yrs added');
    expect(el.textContent).not.toContain('yrs removed');
  });
});

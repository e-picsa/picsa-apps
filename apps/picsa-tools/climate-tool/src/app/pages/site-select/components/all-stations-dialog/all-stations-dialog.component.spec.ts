import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IStationMeta } from '@picsa/models';

import { AllStationsDialogComponent } from './all-stations-dialog.component';

describe('AllStationsDialogComponent', () => {
  let component: AllStationsDialogComponent;
  let fixture: ComponentFixture<AllStationsDialogComponent>;
  const mockDialogRef = {
    close: jest.fn(),
  };
  const mockDialogData = {
    data: [{ id: 'stn_1', name: 'Station 1' }],
    options: { displayColumns: ['name'] },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllStationsDialogComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AllStationsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the dialog component', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog with selected station when a row is clicked', () => {
    const station = { id: 'stn_1', name: 'Station 1' } as IStationMeta;
    component.onRowClick(station);
    expect(mockDialogRef.close).toHaveBeenCalledWith(station);
  });
});

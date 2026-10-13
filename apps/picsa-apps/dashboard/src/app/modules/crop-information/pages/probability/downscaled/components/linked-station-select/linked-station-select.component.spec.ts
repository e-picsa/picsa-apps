import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PicsaMapComponent } from '@picsa/shared/features/map/map';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DeploymentDashboardService } from '../../../../../../deployment/deployment.service';
import { CropLinkedStationSelectComponent } from './linked-station-select.component';

/* eslint-disable @angular-eslint/component-selector, @angular-eslint/no-output-on-prefix */
@Component({
  selector: 'picsa-map',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockPicsaMapComponent {
  public markers = input<unknown[]>([]);
  public onMarkerClick = output<unknown>();
  public mapReady = signal<boolean>(true);
  public addGeoJsonLayer = jest.fn();
  public removeGeoJsonLayer = jest.fn();
  public setActiveMarker = jest.fn();
}
/* eslint-enable @angular-eslint/component-selector, @angular-eslint/no-output-on-prefix */

describe('CropLinkedStationSelectComponent', () => {
  let component: CropLinkedStationSelectComponent;
  let fixture: ComponentFixture<CropLinkedStationSelectComponent>;

  const mockActiveCountry = signal<string>('mw');
  const mockLocationData = signal(null);
  const mockDeploymentService = {
    activeDeploymentCountry: mockActiveCountry,
    activeDeploymentLocationData: mockLocationData,
  };

  const mockSupabaseService = {
    ready: jest.fn().mockResolvedValue(true),
    db: {
      table: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [] }),
        }),
      }),
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropLinkedStationSelectComponent, NoopAnimationsModule],
      providers: [
        { provide: DeploymentDashboardService, useValue: mockDeploymentService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    })
      .overrideComponent(CropLinkedStationSelectComponent, {
        remove: { imports: [PicsaMapComponent] },
        add: { imports: [MockPicsaMapComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CropLinkedStationSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('locationId', 'salima');
    fixture.componentRef.setInput('downscaledData', {
      country_code: 'mw',
      location_id: 'salima',
      station_id: 'mw/salima_airport',
      water_requirements: {},
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

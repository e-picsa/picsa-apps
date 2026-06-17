import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatSelectModule } from '@angular/material/select';
import { topoJsonToGeoJson } from '@picsa/data/geoLocation';
import type { CountryCodeLegacy } from '@picsa/server-types';
import { IMapMarker, PicsaMapComponent } from '@picsa/shared/features/map/map';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { IStationRow } from '../../../../../../climate/types';
import { DeploymentDashboardService } from '../../../../../../deployment/deployment.service';
import { ICropDataDownscaled } from '../../../../../services';

@Component({
  selector: 'dashboard-crop-linked-station-select',
  imports: [MatSelectModule, MatFormField, MatButtonModule, PicsaMapComponent],
  templateUrl: './linked-station-select.component.html',
  styleUrl: './linked-station-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropLinkedStationSelectComponent {
  private supabaseService = inject(SupabaseService);
  private deploymentService = inject(DeploymentDashboardService);

  public allStations = signal<IStationRow[]>([]);
  public locationId = input.required<string>();
  public downscaledData = input.required<ICropDataDownscaled['Row']>();

  public stationSelected = output<string | undefined>();

  public readonly selectedStationId = signal<string | undefined>(undefined);
  public readonly searchTerm = signal('');

  public readonly locationGeoJson = signal<any>(undefined);
  public readonly picsaMap = viewChild(PicsaMapComponent);
  public readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // Filter stations based on search term and sort them alphabetically
  public readonly filteredStations = computed(() => {
    const stations = this.allStations();
    const term = this.searchTerm().toLowerCase().trim();

    // Sort alphabetically by station name
    const sorted = [...stations].sort((a, b) => (a.station_name || '').localeCompare(b.station_name || ''));

    if (!term) return sorted;
    return sorted.filter((s) => (s.station_name || '').toLowerCase().includes(term));
  });

  // Filter stations that have coordinates
  public readonly stationsWithCoords = computed(() => {
    return this.allStations().filter((s) => s.latitude !== null && s.longitude !== null);
  });

  // Convert stations to map markers
  public readonly mapMarkers = computed<IMapMarker[]>(() => {
    return this.stationsWithCoords().map((s, index) => ({
      _index: index,
      latlng: [s.latitude as number, s.longitude as number] as [number, number],
      number: index + 1,
    }));
  });

  public getSelectedStationName(id: string | undefined): string {
    if (!id) return '';
    const station = this.allStations().find((s) => s.id === id);
    return station?.station_name || '';
  }

  constructor() {
    effect(async (onCleanup) => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      const locationId = this.locationId();
      if (countryCode && locationId) {
        let active = true;
        onCleanup(() => {
          active = false;
        });

        try {
          const stations = await this.fetchStations(countryCode);
          if (active) {
            this.allStations.set(stations);
          }

          const geoJsonFeature = await this.fetchMapData(countryCode, locationId);
          if (active) {
            this.locationGeoJson.set(geoJsonFeature);
          }
        } catch (e) {
          console.error('Failed to load stations/map data:', e);
        }
      }
    });

    effect(() => {
      this.selectedStationId.set(this.downscaledData()?.station_id || undefined);
    });

    // Reactive effect to draw/highlight the district polygon on the Leaflet map
    effect((cleanup) => {
      const mapComponent = this.picsaMap();
      const map = mapComponent?.map();
      const districtGeo = this.locationGeoJson();

      if (!mapComponent || !map || !districtGeo) return;

      const L = mapComponent.L;

      const geoJsonLayer = L.geoJSON(districtGeo, {
        style: {
          color: '#3388ff',
          fillColor: '#3388ff',
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0.25,
        },
      });

      geoJsonLayer.addTo(map);

      // Fit map bounds to the district boundary
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }

      cleanup(() => {
        if (map.hasLayer(geoJsonLayer)) {
          map.removeLayer(geoJsonLayer);
        }
      });
    });

    // Reactive effect to highlight the selected station's marker on the map when ready
    effect(() => {
      const mapComponent = this.picsaMap();
      const map = mapComponent?.map();
      const selectedId = this.selectedStationId();
      const markers = this.mapMarkers();

      if (!mapComponent || !map || !selectedId || markers.length === 0) return;

      const selectedMarkerIndex = this.stationsWithCoords().findIndex((s) => s.id === selectedId);

      if (selectedMarkerIndex !== -1) {
        const marker = markers.find((m) => m._index === selectedMarkerIndex);
        if (marker) {
          setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentSelected = (mapComponent as any).selected?.marker;
            if (!currentSelected || currentSelected._index !== marker._index) {
              mapComponent.setActiveMarker(marker);
            }
          }, 200);
        }
      }
    });
  }

  /** Retrieve list of climate stations from db */
  private async fetchStations(countryCode: CountryCodeLegacy): Promise<IStationRow[]> {
    await this.supabaseService.ready();
    const { data, error } = await this.supabaseService.db
      .table('climate_stations')
      .select('*')
      .eq('country_code', countryCode);
    if (error) throw error;
    return data || [];
  }

  /** Retrieve TopoJSON, convert to GeoJSON and match the current location's geometry */
  private async fetchMapData(countryCode: CountryCodeLegacy, locationId: string): Promise<any> {
    const locationData = this.deploymentService.activeDeploymentLocationData();
    if (!locationData) return undefined;

    const topojsonObj = await locationData.topoJson();
    const adminLevel = locationData.admin_5 ? 5 : 4;
    const geojson = topoJsonToGeoJson(topojsonObj, adminLevel);

    const locations = locationData.admin_5?.locations || locationData.admin_4.locations;
    const location = locations.find((v) => v.id === locationId);

    if (location) {
      const normalizedTarget = this.normalizeName(location.label);
      return geojson.features.find((f) => this.normalizeName(f.properties.name) === normalizedTarget);
    }
    return undefined;
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(district|province)\b/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  public onSelectOpened(opened: boolean) {
    if (opened) {
      setTimeout(() => {
        this.searchInput()?.nativeElement.focus();
      });
    } else {
      this.searchTerm.set('');
      const inputEl = this.searchInput()?.nativeElement;
      if (inputEl) {
        inputEl.value = '';
      }
    }
  }

  public onMarkerClicked(marker: IMapMarker) {
    const { _index } = marker;
    const station = this.stationsWithCoords()[_index];
    if (station && station.id) {
      this.selectedStationId.set(station.id);

      // Also highlight/select the marker visual if map available
      const mapComponent = this.picsaMap();
      if (mapComponent) {
        mapComponent.setActiveMarker(marker);
      }
    }
  }
}

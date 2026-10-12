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
import { getDeepestAdminLevel, getDeepestLocations, topoJsonToGeoJson } from '@picsa/data/geoLocation';
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
    effect(() => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      const locationId = this.locationId();
      if (countryCode && locationId) {
        this.handleLocationChange(countryCode, locationId);
      }
    });

    effect(() => {
      this.selectedStationId.set(this.downscaledData()?.station_id || undefined);
    });

    // Reactive effect to draw/highlight the district polygon on the map
    effect((cleanup) => {
      const mapComponent = this.picsaMap();
      const districtGeo = this.locationGeoJson();
      if (!mapComponent || !mapComponent.mapReady() || !districtGeo) return;

      mapComponent.addGeoJsonLayer('district-boundary', districtGeo, {
        fillColor: '#3388ff',
        fillOpacity: 0.25,
        lineColor: '#3388ff',
        lineWidth: 3,
        lineOpacity: 0.8,
        fitBounds: true,
        padding: 30,
      });

      cleanup(() => {
        mapComponent.removeGeoJsonLayer('district-boundary');
      });
    });

    // Reactive effect to highlight the selected station's marker on the map when ready
    effect(() => {
      const mapComponent = this.picsaMap();
      const selectedId = this.selectedStationId();
      const markers = this.mapMarkers();

      if (!mapComponent || !mapComponent.mapReady() || !selectedId || markers.length === 0) return;

      const selectedMarkerIndex = this.stationsWithCoords().findIndex((s) => s.id === selectedId);

      if (selectedMarkerIndex !== -1) {
        const marker = markers.find((m) => m._index === selectedMarkerIndex);
        if (marker) {
          setTimeout(() => {
            mapComponent.setActiveMarker(marker);
          }, 200);
        }
      }
    });
  }

  private async handleLocationChange(countryCode: CountryCodeLegacy, locationId: string) {
    const stations = await this.fetchStations(countryCode);
    this.allStations.set(stations);
    const geoJsonFeature = await this.fetchMapData(countryCode, locationId);
    this.locationGeoJson.set(geoJsonFeature);
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
    // filter to deepest tier with data - district geometries appear once level 6 topo exists
    const adminLevel = getDeepestAdminLevel(locationData);
    const geojson = topoJsonToGeoJson(topojsonObj, adminLevel);

    const locations = getDeepestLocations(locationData);
    const location = locations.find((v) => v.id === locationId);

    if (location) {
      const candidates = [location.label, (location as { topoName?: string }).topoName].filter((v): v is string => !!v);
      return geojson.features.find((f) =>
        candidates.some((name) => this.normalizeName(f.properties.name) === this.normalizeName(name)),
      );
    }
    return undefined;
  }

  private normalizeName(name: string | undefined | null): string {
    return (name || '')
      .toLowerCase()
      .replace(/\b(district|province)\b/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  public handleStationSelectOpen() {
    setTimeout(() => {
      this.searchInput()?.nativeElement.focus();
    });
  }

  public handleStationSelectClose() {
    this.searchTerm.set('');
    const inputEl = this.searchInput()?.nativeElement;
    if (inputEl) {
      inputEl.value = '';
    }
  }

  public onMarkerClicked(marker: IMapMarker) {
    const { _index } = marker;
    const station = this.stationsWithCoords()[_index];
    if (station?.id) {
      this.selectedStationId.set(station.id);

      // Also highlight/select the marker visual if map available
      const mapComponent = this.picsaMap();
      if (mapComponent) {
        mapComponent.setActiveMarker(marker);
      }
    }
  }
}

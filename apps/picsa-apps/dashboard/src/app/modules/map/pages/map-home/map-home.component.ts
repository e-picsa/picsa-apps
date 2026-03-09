import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { topoJsonToGeoJson } from '@picsa/data/geoLocation/utils';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import * as L from 'leaflet';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';

@Component({
  selector: 'dashboard-map-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './map-home.component.html',
  styleUrls: ['./map-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapHomeComponent implements AfterViewInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  private deploymentService = inject(DeploymentDashboardService);

  private map: L.Map | undefined;
  private geoJsonLayer: L.GeoJSON | undefined;

  public isLoading = signal(false);
  public boundaries = signal<any[]>([]);

  constructor() {
    effect(() => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      if (countryCode && this.map) {
        this.fetchBoundaries();
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
    this.fetchBoundaries();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    this.map = L.map('map-container').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  }

  public async fetchBoundaries() {
    const code = this.deploymentService.activeDeploymentCountry();
    if (!code) return;

    this.isLoading.set(true);
    try {
      // Access the underlying supabase client to query a non-public schema
      const client = (this.supabaseService as any).supabase;
      const { data, error } = await client.schema('geo').from('boundaries').select('*').eq('country_code', code);

      if (!error && data) {
        this.boundaries.set(data);
        this.renderBoundaries();
      } else if (error) {
        console.error('Error fetching boundaries:', error);
      }
    } catch (e) {
      console.error('Failed to fetch boundaries', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private renderBoundaries() {
    if (!this.map) return;

    if (this.geoJsonLayer) {
      this.map.removeLayer(this.geoJsonLayer);
    }

    const data = this.boundaries();
    if (data.length === 0) return;

    this.geoJsonLayer = L.geoJSON(undefined, {
      style: {
        color: '#3388ff',
        weight: 1,
        fillOpacity: 0.1,
      },
    });

    data.forEach((row) => {
      if (row.topojson) {
        try {
          const geojson = topoJsonToGeoJson(row.topojson as any);
          this.geoJsonLayer!.addData(geojson as any);
        } catch (e) {
          console.error('Failed to convert TopoJSON to GeoJSON', e);
        }
      }
    });

    this.geoJsonLayer.addTo(this.map);

    const bounds = this.geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  public async generateBoundaries() {
    this.isLoading.set(true);
    try {
      await this.supabaseService.invokeFunction('geo/admin-boundaries');
      await this.fetchBoundaries();
    } catch (e) {
      console.error('Failed to invoke geo/admin-boundaries', e);
    } finally {
      this.isLoading.set(false);
    }
  }
}

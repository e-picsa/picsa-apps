import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { topoJsonToGeoJson } from '@picsa/data/geoLocation/utils';
import * as L from 'leaflet';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { DashboardMapService } from '../../map.service';

@Component({
  selector: 'dashboard-map-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './map-home.component.html',
  styleUrls: ['./map-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapHomeComponent implements AfterViewInit, OnDestroy {
  public mapService = inject(DashboardMapService);
  private deploymentService = inject(DeploymentDashboardService);

  private map: L.Map | undefined;
  private geoJsonLayer: L.GeoJSON | undefined;

  public activeAdminLevel = signal<number>(3);
  public isEditingLabel = signal<number | null>(null);
  public editLabelText = signal<string>('');

  public availableLevels = [3, 4, 5];

  public displayedBoundary = computed(() => {
    const level = this.activeAdminLevel();
    return this.mapService.boundaries().find((b) => b.admin_level === level);
  });

  constructor() {
    effect(() => {
      // Re-render map when boundaries or active level change
      this.displayedBoundary();
      if (this.map) {
        this.renderBoundaries();
      }
    });

    effect(() => {
      // Refresh boundaries when deployment changes
      const countryCode = this.deploymentService.activeDeploymentCountry();
      if (countryCode && this.map) {
        this.mapService.fetchBoundaries();
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
    this.mapService.fetchBoundaries();
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

  private renderBoundaries() {
    if (!this.map) return;

    if (this.geoJsonLayer) {
      this.map.removeLayer(this.geoJsonLayer);
    }

    const row = this.displayedBoundary();
    if (!row || !row.topojson) return;

    this.geoJsonLayer = L.geoJSON(undefined, {
      style: {
        color: '#3388ff',
        weight: 1,
        fillOpacity: 0.1,
      },
    });

    try {
      const geojson = topoJsonToGeoJson(row.topojson as never);
      if (this.geoJsonLayer) {
        this.geoJsonLayer.addData(geojson as never);
      }
    } catch (e) {
      console.error('Failed to convert TopoJSON to GeoJSON', e);
    }

    this.geoJsonLayer.addTo(this.map);

    const bounds = this.geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  public getBoundaryForLevel(level: number) {
    return this.mapService.boundaries().find((b) => b.admin_level === level);
  }

  public getLabelForLevel(level: number): string {
    const b = this.getBoundaryForLevel(level);
    return b?.label || `Admin Level ${level}`;
  }

  public selectLevel(level: number) {
    this.activeAdminLevel.set(level);
  }

  public startEditLabel(level: number, currentLabel: string) {
    this.isEditingLabel.set(level);
    this.editLabelText.set(currentLabel);
  }

  public async saveLabel(level: number) {
    await this.mapService.updateAdminLevelLabel(level, this.editLabelText());
    this.isEditingLabel.set(null);
  }

  public cancelEdit() {
    this.isEditingLabel.set(null);
  }

  public generateBoundaries(level: number) {
    this.mapService.generateBoundaries(level);
  }
}

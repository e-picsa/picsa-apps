import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { topoJsonToGeoJson } from '@picsa/data/geoLocation/utils';
import { PicsaMapComponent } from '@picsa/shared/features/map/map';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { DashboardMapService } from '../../map.service';

const BOUNDARY_LAYER_ID = 'admin-boundaries';

@Component({
  selector: 'dashboard-map-home',
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, PicsaMapComponent],
  templateUrl: './map-home.component.html',
  styleUrls: ['./map-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapHomeComponent implements OnInit {
  public mapService = inject(DashboardMapService);
  private deploymentService = inject(DeploymentDashboardService);

  public picsaMap = viewChild(PicsaMapComponent);

  public activeAdminLevel = signal<number>(3);
  public isEditingLabel = signal<number | null>(null);
  public editLabelText = signal<string>('');
  public hasFeatures = signal<boolean>(true);

  public availableLevels = [2, 3, 4, 5, 6];

  public displayedBoundary = computed(() => {
    const level = this.activeAdminLevel();
    return this.mapService.boundaries().find((b) => b.admin_level === level);
  });

  constructor() {
    effect(() => {
      // Re-render map when boundaries or active level change
      const picsaMap = this.picsaMap();
      const boundary = this.displayedBoundary();
      if (picsaMap && picsaMap.mapReady() && boundary) {
        this.renderBoundaries(picsaMap);
      }
    });

    effect(() => {
      // Refresh boundaries when deployment changes
      const countryCode = this.deploymentService.activeDeploymentCountry();
      if (countryCode) {
        this.mapService.fetchBoundaries();
      }
    });
  }

  ngOnInit() {
    this.mapService.fetchBoundaries();
  }

  private renderBoundaries(picsaMap: PicsaMapComponent) {
    const row = this.displayedBoundary();
    if (!row || !row.topojson) {
      picsaMap.removeGeoJsonLayer(BOUNDARY_LAYER_ID);
      this.hasFeatures.set(false);
      return;
    }

    try {
      const topojsonObj = row.topojson as unknown as Record<string, unknown>;
      const objects = topojsonObj['objects'] as Record<string, unknown> | undefined;

      if (!topojsonObj || !objects || Object.keys(objects).length === 0) {
        picsaMap.removeGeoJsonLayer(BOUNDARY_LAYER_ID);
        this.hasFeatures.set(false);
        return;
      }

      const geojson = topoJsonToGeoJson(topojsonObj as never, row.admin_level);
      let validFeatures = false;
      if (geojson) {
        if (geojson.type === 'FeatureCollection') {
          validFeatures = Array.isArray(geojson.features) && geojson.features.length > 0;
        } else if (geojson.type === 'Feature') {
          validFeatures = true;
        }
      }

      this.hasFeatures.set(validFeatures);

      if (!validFeatures) {
        picsaMap.removeGeoJsonLayer(BOUNDARY_LAYER_ID);
        return;
      }
      picsaMap.addGeoJsonLayer(BOUNDARY_LAYER_ID, geojson, {
        lineColor: '#3388ff',
        lineWidth: 1,
        fillColor: '#3388ff',
        fillOpacity: 0.1,
        fitBounds: true,
        padding: 20,
      });
    } catch (e) {
      picsaMap.removeGeoJsonLayer(BOUNDARY_LAYER_ID);
      this.hasFeatures.set(false);
      console.error('Failed to convert TopoJSON to GeoJSON', e);
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

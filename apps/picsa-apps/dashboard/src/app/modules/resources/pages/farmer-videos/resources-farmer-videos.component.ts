import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ICountryCode, ILocaleDataEntry, LOCALES_DATA, LOCALES_DATA_HASHMAP } from '@picsa/data/deployments';
import { IPicsaVideo } from '@picsa/data/resources';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import download from 'downloadjs';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import {
  buildMatrixRows,
  calculateStats,
  formatVariantCountry,
  formatVariantLanguages,
  generateMatrixCSV,
  getColumnCoverage,
  getCountryLabel,
  getDirectToFarmerVideos,
  getLocalesForCountry,
  getVideosForCountry,
  IFarmerVideoConfig,
  IFarmerVideoMatrixRow,
  IFarmerVideoStats,
  IVideoPreviewData,
} from './resources-farmer-videos.utils';

@Component({
  selector: 'dashboard-resources-farmer-videos',
  imports: [CommonModule, FormsModule, DashboardMaterialModule, SizeMBPipe],
  templateUrl: './resources-farmer-videos.component.html',
  styleUrls: ['./resources-farmer-videos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesFarmerVideosComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private deploymentService = inject(DeploymentDashboardService);

  @ViewChild('videoPreviewDialog')
  videoPreviewDialog!: TemplateRef<{ $implicit: IVideoPreviewData }>;

  /** Search query for filtering video titles, IDs, or categories */
  public searchTerm = signal<string>('');

  /** Active view mode tab (0: Matrix view, 1: Catalog view) */
  public activeTab = signal<number>(0);

  /** All configured direct-to-farmer videos */
  public readonly allVideos: IFarmerVideoConfig[] = getDirectToFarmerVideos();

  /** Full set of configured application locales */
  public readonly allLocales: ILocaleDataEntry[] = LOCALES_DATA;

  /** Active deployment country code (e.g. 'mw', 'zm', 'zw', or 'global') */
  public readonly activeCountry = computed<string>(() => {
    return this.deploymentService.activeDeploymentCountry() || 'global';
  });

  /** Human-readable country label for active deployment */
  public readonly countryLabel = computed<string>(() => {
    return getCountryLabel(this.activeCountry());
  });

  /** Direct-to-farmer videos relevant to the active deployment country */
  public readonly countryVideos = computed<IFarmerVideoConfig[]>(() => {
    return getVideosForCountry(this.allVideos, this.activeCountry());
  });

  /** Configured locales to show for the active deployment country */
  public readonly countryLocales = computed<ILocaleDataEntry[]>(() => {
    return getLocalesForCountry(this.allLocales, this.activeCountry());
  });

  /** Rows for the translation matrix based on active locales and search query */
  public readonly matrixRows = computed<IFarmerVideoMatrixRow[]>(() => {
    return buildMatrixRows(this.countryVideos(), this.countryLocales(), this.searchTerm());
  });

  /** High-level summary metrics across the current country view */
  public readonly stats = computed<IFarmerVideoStats>(() => {
    return calculateStats(this.matrixRows(), this.countryLocales());
  });

  // Template utility functions
  public readonly getCountryLabel = getCountryLabel;
  public readonly formatVariantLanguages = formatVariantLanguages;
  public readonly formatVariantCountry = formatVariantCountry;

  /** Calculates coverage statistics for a column/locale */
  public getColumnCoverage(localeId: string): {
    available: number;
    applicable: number;
    percent: number;
  } {
    return getColumnCoverage(this.matrixRows(), localeId);
  }

  /** Opens video preview dialog for a matrix cell */
  public openPreview(
    row: IFarmerVideoMatrixRow,
    video: IPicsaVideo,
    locale: ILocaleDataEntry,
    isSubtitled = false,
  ): void {
    const data: IVideoPreviewData = {
      videoTitle: row.title,
      videoId: row.id,
      localeLabel: locale.language_label,
      countryName: getCountryLabel(locale.country_code),
      localeCode: locale.id,
      resolution: video.resolution,
      sizeKb: video.size_kb,
      url: video.supabase_url,
      isSubtitled,
    };

    this.dialog.open(this.videoPreviewDialog, {
      data,
      width: '760px',
      maxWidth: '95vw',
    });
  }

  /** Opens video preview dialog directly from catalog variant */
  public openVariantPreview(row: IFarmerVideoMatrixRow, child: IPicsaVideo): void {
    const firstCode = child.locale_codes[0];
    const locale = LOCALES_DATA_HASHMAP[firstCode] || {
      id: firstCode,
      language_label: firstCode,
      country_code: 'global' as ICountryCode,
      language_code: 'en',
      flag_path: '',
    };
    this.openPreview(row, child, locale);
  }

  /** Copies video storage URL to clipboard */
  public copyUrl(url: string, event: Event): void {
    event.stopPropagation();
    navigator.clipboard.writeText(url).then(
      () => {
        this.snackBar.open('Video URL copied to clipboard', 'Dismiss', {
          duration: 2500,
        });
      },
      () => {
        this.snackBar.open('Failed to copy URL', 'Dismiss', { duration: 2500 });
      },
    );
  }

  /** Exports translation matrix as downloadable CSV */
  public exportMatrixCSV(): void {
    const csvString = generateMatrixCSV(this.matrixRows(), this.countryLocales());
    const country = this.activeCountry();
    download(
      new Blob([csvString], { type: 'text/csv' }),
      `picsa_farmer_videos_${country}_${Date.now()}.csv`,
      'text/csv',
    );
  }
}

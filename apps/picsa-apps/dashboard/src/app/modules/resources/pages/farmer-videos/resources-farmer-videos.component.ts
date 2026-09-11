import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ILocaleDataEntry, LOCALES_DATA } from '@picsa/data/deployments';
import { IPicsaVideo } from '@picsa/data/resources';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import {
  buildMatrixRows,
  calculateStats,
  formatVariantCountry,
  formatVariantLanguages,
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
      panelClass: 'video-preview-dialog-panel',
    });
  }

  /** Opens video preview dialog directly for an item from the catalog */
  public openVariantPreview(row: IFarmerVideoMatrixRow, variant: IPicsaVideo): void {
    const firstLocale = variant.locale_codes[0];
    const meta = this.allLocales.find((l) => l.id === firstLocale);
    const countryName = getCountryLabel(meta ? meta.country_code : firstLocale.split('_')[0]);

    // Check if secondary locale has English (subtitled)
    const isSubtitled =
      variant.locale_codes.length > 1 && variant.locale_codes.some((c) => c.endsWith('_en') && c !== firstLocale);

    const data: IVideoPreviewData = {
      videoTitle: row.title,
      videoId: row.id,
      localeLabel: formatVariantLanguages(variant),
      countryName,
      localeCode: variant.locale_codes.join(', '),
      resolution: variant.resolution,
      sizeKb: variant.size_kb,
      url: variant.supabase_url,
      isSubtitled,
    };

    this.dialog.open(this.videoPreviewDialog, {
      data,
      width: '760px',
      maxWidth: '95vw',
      panelClass: 'video-preview-dialog-panel',
    });
  }

  /** Copies video URL to clipboard */
  public async copyUrl(url: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      this.snackBar.open('Video URL copied to clipboard', 'Dismiss', { duration: 2500 });
    } catch {
      this.snackBar.open('Failed to copy URL', 'Dismiss', { duration: 2500 });
    }
  }
}

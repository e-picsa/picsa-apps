import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ICountryCode, ILocaleDataEntry, LOCALES_DATA, LOCALES_DATA_HASHMAP } from '@picsa/data/deployments';
import { IPicsaVideo, IPicsaVideoData, PICSA_FARMER_VIDEOS_DATA } from '@picsa/data/resources';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import download from 'downloadjs';

import { DashboardMaterialModule } from '../../../../material.module';
import {
  buildFarmerVideoMatrixRows,
  calculateFarmerVideoStats,
  filterLocales,
  formatVariantCountry,
  formatVariantLanguages,
  generateMatrixCSV,
  getCountryLabel,
  getLocaleCoverage,
  ICountryFilterOption,
  IFarmerVideoMatrixRow,
  IFarmerVideoStats,
  IVideoPreviewData,
} from './resources-admin.utils';

@Component({
  selector: 'dashboard-resources-admin',
  imports: [CommonModule, FormsModule, DashboardMaterialModule, SizeMBPipe],
  templateUrl: './resources-admin.component.html',
  styleUrls: ['./resources-admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesAdminComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild('videoPreviewDialog')
  videoPreviewDialog!: TemplateRef<{ $implicit: IVideoPreviewData }>;

  /** Search query for filtering video titles or IDs */
  public searchTerm = signal<string>('');

  /** Selected country code filter ('all' or specific country) */
  public selectedCountry = signal<string>('all');

  /** Whether to hide locales that do not have any farmer videos */
  public onlyLocalesWithVideos = signal<boolean>(true);

  /** Active view mode tab (0: Matrix view, 1: Catalog view) */
  public activeTab = signal<number>(0);

  /** Raw farmer videos list */
  public readonly farmerVideos: IPicsaVideoData[] = PICSA_FARMER_VIDEOS_DATA;

  /** Configured locales from deployments */
  public readonly allLocales: ILocaleDataEntry[] = LOCALES_DATA;

  /** Available country options for filter dropdown */
  public readonly availableCountries: ICountryFilterOption[] = [
    { code: 'all', label: 'All Countries' },
    { code: 'global', label: 'Global' },
    { code: 'mw', label: 'Malawi' },
    { code: 'zm', label: 'Zambia' },
    { code: 'zw', label: 'Zimbabwe' },
    { code: 'tj', label: 'Tajikistan' },
  ];

  /** Set of locale codes that have at least one farmer video asset */
  public readonly localesWithVideos = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const video of this.farmerVideos) {
      for (const child of video.children) {
        for (const code of child.locale_codes) {
          set.add(code);
        }
      }
    }
    return set;
  });

  /** Locales to display in the matrix columns based on filters */
  public readonly filteredLocales = computed<ILocaleDataEntry[]>(() =>
    filterLocales(this.allLocales, this.selectedCountry(), this.onlyLocalesWithVideos(), this.localesWithVideos()),
  );

  /** Matrix rows matching search query */
  public readonly matrixRows = computed<IFarmerVideoMatrixRow[]>(() =>
    buildFarmerVideoMatrixRows(this.farmerVideos, this.searchTerm()),
  );

  /** High-level summary metrics */
  public readonly stats = computed<IFarmerVideoStats>(() => calculateFarmerVideoStats(this.farmerVideos));

  // Template helper delegates
  public readonly getCountryLabel = getCountryLabel;
  public readonly formatVariantLanguages = formatVariantLanguages;
  public readonly formatVariantCountry = formatVariantCountry;

  /** Get translation coverage count & percentage for a locale */
  public getLocaleCoverage(localeCode: string): { count: number; percent: number } {
    return getLocaleCoverage(this.farmerVideos, localeCode);
  }

  /** Open video preview dialog for a specific matrix cell */
  public openPreview(row: IFarmerVideoMatrixRow, video: IPicsaVideo, locale: ILocaleDataEntry): void {
    const data: IVideoPreviewData = {
      videoTitle: row.title,
      videoId: row.id,
      localeLabel: locale.language_label,
      countryName: getCountryLabel(locale.country_code),
      localeCode: locale.id,
      resolution: video.resolution,
      sizeKb: video.size_kb,
      url: video.supabase_url,
    };

    this.dialog.open(this.videoPreviewDialog, {
      data,
      width: '760px',
      maxWidth: '95vw',
    });
  }

  /** Open video preview dialog directly from catalog variant */
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

  /** Copy video storage URL to system clipboard */
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

  /** Trigger CSV file download for the current filtered matrix */
  public exportMatrixCSV(): void {
    const csvString = generateMatrixCSV(this.matrixRows(), this.filteredLocales());
    download(
      new Blob([csvString], { type: 'text/csv' }),
      `picsa_farmer_videos_translations_${Date.now()}.csv`,
      'text/csv',
    );
  }
}

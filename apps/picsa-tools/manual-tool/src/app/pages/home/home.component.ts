/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigurationService } from '@picsa/configuration/src';
import { IResourceFile } from '@picsa/resources/src/app/models';
import { ResourcesStore } from '@picsa/resources/src/app/stores';
import { FlyInOut } from '@picsa/shared/animations';
import { Subject, takeUntil } from 'rxjs';

import { PICSA_MANUAL_CONTENTS_EXTENSION, PICSA_MANUAL_CONTENTS_FARMER } from '../../data';
import { PICSA_MANUAL_RESOURCES } from '../../data';

type IManualVersion = 'extension' | 'farmer';
const TAB_MAPPING: { [version in IManualVersion]: number } = { extension: 0, farmer: 1 };

const LOCALISED_VERSIONS: { [version in IManualVersion]: { [code: string]: IResourceFile } } = {
  extension: {
    en: PICSA_MANUAL_RESOURCES.picsa_manual,
    zm_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa,
    mw_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa,
  },
  farmer: {
    en: PICSA_MANUAL_RESOURCES.picsa_manual_farmer,
    zm_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa_farmer,
    mw_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa_farmer,
  },
} as const;

@Component({
  selector: 'picsa-manual-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [FlyInOut({ axis: 'Y' })],
})
export class HomeComponent implements OnInit, OnDestroy {
  public page?: number = undefined;
  public pdfSrc?: string;
  /** Used to track whether extension or farmer tab should be displayed */
  public initialTabIndex = 1;
  public localisation: string;

  public contents = {
    extension: PICSA_MANUAL_CONTENTS_EXTENSION,
    farmer: PICSA_MANUAL_CONTENTS_FARMER,
  };

  public downloadPrompt = {
    show: false,
    title: translateMarker('Manual Requires Download'),
    resource: {} as IResourceFile,
  };

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private ConfigurationService: ConfigurationService,
    private resourcesStore: ResourcesStore
  ) {
    this.route.queryParams.pipe(takeUntil(this.componentDestroyed$)).subscribe(({ page }) => {
      this.page = Number(page);
    });
    // Start with tab user most recently used
    const version = this.getManualVersion();
    this.initialTabIndex = TAB_MAPPING[version];
  }

  ngOnInit(): void {
    this.ConfigurationService.activeConfiguration$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(async (config) => {
        const code = config.localisation.language.selected?.code || 'en';
        this.localisation = code;
        this.loadManual();
      });
  }

  /**
   * Read local language setting and manual version preference to determine which version of the manual
   * to attempt loading
   */
  private async loadManual() {
    await this.resourcesStore.ready();
    const code = this.localisation;
    const version = this.getManualVersion();
    // Pick manual version, with fallback to english if not available
    const manualResource = LOCALISED_VERSIONS[version][code] || LOCALISED_VERSIONS[version].en;
    const isDownloaded = this.resourcesStore.isFileDownloaded(manualResource);
    if (isDownloaded) {
      this.pdfSrc = await this.resourcesStore.getFileLocalLink(manualResource);
    } else {
      this.downloadPrompt.show = true;
      this.downloadPrompt.resource = manualResource;
    }
  }

  public async setSelectedTab(index: number) {
    this.initialTabIndex = index;
    this.setManualVersion(index === 1 ? 'farmer' : 'extension');
    this.loadManual();
  }

  /** use localstorage to track farmer version preference */
  private getManualVersion(): IManualVersion {
    return localStorage.getItem('manual_version') === 'farmer' ? 'farmer' : 'extension';
  }
  private setManualVersion(version: IManualVersion = 'extension') {
    return localStorage.setItem('manual_version', version);
  }

  public async handleManualDownloaded(resource: IResourceFile) {
    this.downloadPrompt.show = false;
    this.pdfSrc = await this.resourcesStore.getFileLocalLink(resource);
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}

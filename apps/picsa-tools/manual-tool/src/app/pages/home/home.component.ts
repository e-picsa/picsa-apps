/* eslint-disable @nx/enforce-module-boundaries */
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigurationService } from '@picsa/configuration/src';
import { ILocaleCode } from '@picsa/data/deployments';
import { IResourceFile } from '@picsa/resources/schemas';
import { ResourcesToolService } from '@picsa/resources/services/resources-tool.service';
import { FadeInOut, FlyInOut } from '@picsa/shared/animations';
import { RxDocument } from 'rxdb';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [FlyInOut({ axis: 'Y' }), FadeInOut({ inDelay: 200, inSpeed: 300 })],
  standalone: false,
})
export class HomeComponent implements OnDestroy, AfterViewInit {
  // TODO - ideally all variables should be tracked by version (use additional component)
  public resourceDocs: { [version in IManualVersion]: RxDocument<IResourceFile> | null } = {
    farmer: null,
    extension: null,
  };

  public languageCode: ILocaleCode;

  public page?: number = undefined;
  public pdfSrc?: string;
  /** Used to track whether extension or farmer tab should be displayed */
  public initialTabIndex = 0;

  public contents = {
    extension: PICSA_MANUAL_CONTENTS_EXTENSION,
    farmer: PICSA_MANUAL_CONTENTS_FARMER,
  };

  public downloadPrompt = {
    show: false,
    title: translateMarker('Download the PICSA Manual'),
  };

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private ConfigurationService: ConfigurationService,
    private resourcesService: ResourcesToolService,
    private cdr: ChangeDetectorRef
  ) {
    this.route.queryParams.pipe(takeUntil(this.componentDestroyed$)).subscribe(({ page }) => {
      this.page = Number(page);
      this.cdr.markForCheck();
    });
    const version = this.getManualVersion();
    this.initialTabIndex = TAB_MAPPING[version];
    this.languageCode = this.ConfigurationService.userSettings().language_code;
  }

  async ngAfterViewInit() {
    await this.resourcesService.ready();
    await this.loadManual();
    this.cdr.markForCheck();
  }

  /** Prompt manual load if resource file attachment updated */
  public async handleManualDownloaded() {
    await this.loadManual();
    this.cdr.markForCheck();
  }

  /**
   * Read local language setting and manual version preference to determine which version of the manual
   * to attempt loading
   */
  private async loadManual() {
    await this.resourcesService.ready();
    const version = this.getManualVersion();
    const manualResource = LOCALISED_VERSIONS[version][this.languageCode] || LOCALISED_VERSIONS[version].en;
    if (this.pdfSrc) {
      return;
    }
    const manualDoc = await this.resourcesService.dbFiles.findOne(manualResource.id).exec();
    if (manualDoc) {
      this.resourceDocs[version] = manualDoc;
      const uri = await this.resourcesService.getFileAttachmentURI(manualDoc, true);
      if (uri) {
        this.downloadPrompt.show = false;
        this.pdfSrc = uri;
        return;
      }
    }
    this.downloadPrompt.show = true;
  }

  public async setSelectedTab(index: number) {
    this.pdfSrc = undefined;
    const version = index === 1 ? 'farmer' : 'extension';
    this.setManualVersion(version);
    await this.loadManual();
    this.cdr.markForCheck();
  }

  /** use localstorage to track farmer version preference */
  private getManualVersion(): IManualVersion {
    return localStorage.getItem('manual_version') === 'farmer' ? 'farmer' : 'extension';
  }
  private setManualVersion(version: IManualVersion) {
    return localStorage.setItem('manual_version', version);
  }

  ngOnDestroy() {
    // revoke any created object uris (use timeout to avoid destroy while still in use)
    setTimeout(() => {
      this.resourcesService.revokeFileAttachmentURIs([
        ...Object.values(LOCALISED_VERSIONS.extension).map((manual) => manual.filename),
        ...Object.values(LOCALISED_VERSIONS.farmer).map((manual) => manual.filename),
      ]);
    }, 500);
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}

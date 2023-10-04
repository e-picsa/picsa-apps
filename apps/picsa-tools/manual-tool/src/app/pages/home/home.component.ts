/* eslint-disable @nx/enforce-module-boundaries */
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigurationService } from '@picsa/configuration/src';
import { IResourceFile } from '@picsa/resources/src/app/schemas';
import { ResourcesToolService } from '@picsa/resources/src/app/services/resources-tool.service';
import { ANIMATION_DELAYED, FadeInOut, FlyInOut } from '@picsa/shared/animations';
import { RxAttachment, RxDocument } from 'rxdb';
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
  animations: [
    FlyInOut({ axis: 'Y' }),
    FadeInOut({ inDelay: 200, inSpeed: 300 }),

    trigger('openClose', [
      // ...
      state(
        'open',
        style({
          height: '200px',
          opacity: 1,
          backgroundColor: 'yellow',
        })
      ),
      state(
        'closed',
        style({
          height: '100px',
          opacity: 0.8,
          backgroundColor: 'blue',
        })
      ),
      transition('open => closed', [animate('1s')]),
      transition('closed => open', [animate('0.5s')]),
    ]),
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  public resourceDoc: RxDocument<IResourceFile> | null;

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
    title: translateMarker('Download the PICSA Manual'),
  };

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private ConfigurationService: ConfigurationService,
    private resourcesService: ResourcesToolService
  ) {
    this.route.queryParams.pipe(takeUntil(this.componentDestroyed$)).subscribe(({ page }) => {
      this.page = Number(page);
    });
  }

  ngOnInit(): void {
    this.ConfigurationService.activeConfiguration$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(async (config) => {
        const code = config.localisation.language.selected?.code || 'en';
        this.localisation = code;
        // Start with tab user most recently used
        const version = this.getManualVersion();
        this.setSelectedTab(TAB_MAPPING[version]);
      });
  }

  /**
   * Read local language setting and manual version preference to determine which version of the manual
   * to attempt loading
   */
  public async loadManual(attachment?: RxAttachment<IResourceFile>) {
    if (attachment && this.resourceDoc) {
      const uri = await this.resourcesService.getFileAttachmentURI(this.resourceDoc);
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
    this.initialTabIndex = index;
    const version = index === 1 ? 'farmer' : 'extension';
    this.setManualVersion();
    const manualResource = LOCALISED_VERSIONS[version][this.localisation] || LOCALISED_VERSIONS[version].en;
    await this.resourcesService.ready();
    const manualDoc = await this.resourcesService.dbFiles.findOne(manualResource.id).exec();
    if (manualDoc) {
      this.resourceDoc = manualDoc;
    }
  }

  /** use localstorage to track farmer version preference */
  private getManualVersion(): IManualVersion {
    return localStorage.getItem('manual_version') === 'farmer' ? 'farmer' : 'extension';
  }
  private setManualVersion(version: IManualVersion = 'extension') {
    return localStorage.setItem('manual_version', version);
  }

  ngOnDestroy() {
    // revoke any created object uris
    this.resourcesService.revokeFileAttachmentURIs([
      ...Object.values(LOCALISED_VERSIONS.extension).map((manual) => manual.filename),
      ...Object.values(LOCALISED_VERSIONS.farmer).map((manual) => manual.filename),
    ]);
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}

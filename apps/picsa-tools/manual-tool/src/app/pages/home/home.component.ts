import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfigurationService } from '@picsa/configuration/src';
import { FlyInOut } from '@picsa/shared/animations';
import { ResourcesStore } from '@picsa/resources/src/app/stores';
import { Subject, takeUntil } from 'rxjs';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PICSA_MANUAL_RESOURCES } from '../../data/manual-resources';
import { IResourceFile } from '@picsa/resources/src/app/models';

const LOCALISED_VERSIONS = {
  en: PICSA_MANUAL_RESOURCES.picsa_manual,
  zm_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa,
  mw_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa,
};

@Component({
  selector: 'picsa-manual-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [FlyInOut({ axis: 'Y' })],
})
export class HomeComponent implements OnDestroy {
  page?: number = undefined;
  pdfSrc?: string;

  public localisation: string;

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
  }

  ngOnInit(): void {
    this.ConfigurationService.activeConfiguration$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(async (config) => {
        const code = config.localisation.language.selected?.code || 'en';
        this.localisation = code;
        const manualResource: IResourceFile = LOCALISED_VERSIONS[code] || LOCALISED_VERSIONS.en;
        await this.resourcesStore.ready();
        const isDownloaded = this.resourcesStore.isFileDownloaded(manualResource);
        if (isDownloaded) {
          this.pdfSrc = await this.resourcesStore.getFileLocalLink(manualResource);
        } else {
          this.downloadPrompt.show = true;
          this.downloadPrompt.resource = manualResource;
        }
      });
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

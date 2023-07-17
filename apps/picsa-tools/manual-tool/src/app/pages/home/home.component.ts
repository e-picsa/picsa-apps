import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfigurationService, IConfiguration } from '@picsa/configuration';
import { FlyInOut } from '@picsa/shared/animations';
import { ResourcesStore } from '@picsa/resources/src/app/stores';
import RESOURCES from '@picsa/resources/src/app/data';
import { Subject, takeUntil } from 'rxjs';
import { PICSA_MANUAL_RESOURCES } from '../../data/manual-resources';

@Component({
  selector: 'picsa-manual-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [FlyInOut({ axis: 'Y' })],
})
export class HomeComponent implements OnDestroy, OnInit {
  public page?: number = undefined;
  public pdfSrc: string;

  public manualOptions = [PICSA_MANUAL_RESOURCES.picsa_manual];

  public manualSelected = PICSA_MANUAL_RESOURCES.picsa_manual._key;

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private configurationService: ConfigurationService,
    private resourcesStore: ResourcesStore
  ) {
    this.route.queryParams.pipe(takeUntil(this.componentDestroyed$)).subscribe(({ page }) => {
      this.page = Number(page);
    });
  }
  async ngOnInit() {
    this.configurationService.activeConfiguration$.pipe(takeUntil(this.componentDestroyed$)).subscribe((config) => {
      this.loadPicsaManual(config.localisation);
    });
  }
  public handleManualSelect(key: string) {
    const manual = this.manualOptions.find((m) => m._key === key);
    if (manual) {
      console.log('load manual', key, manual);
    }
  }
  private async loadPicsaManual(localisation: IConfiguration.Localisation) {
    console.log('load picsa manual', localisation);
    const code = localisation.country.code || 'en';
    this.manualOptions = Object.values(PICSA_MANUAL_RESOURCES).filter(
      (resource) => !resource.appLocalisations || resource.appLocalisations?.includes(code as any)
    );
    console.log('available versions', code, this.manualOptions);
    // if (code === 'en') {
    //   this.pdfSrc = PDF_VERSIONS.en;
    //   return;
    // } else {
    //   await this.resourcesStore.ready();
    //   const filename = PDF_VERSIONS[code] || PDF_VERSIONS.en;
    //   const isFileDownloaded = this.resourcesStore.isFileDownloaded({ filename } as any);
    //   console.log('isFileDownloaded', isFileDownloaded, filename);
    //   RESOURCES.byId;
    //   this.pdfSrc = PDF_VERSIONS[code] || PDF_VERSIONS.en;
    // }
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}

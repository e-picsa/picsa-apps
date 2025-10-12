/* eslint-disable @nx/enforce-module-boundaries */
import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IResourceFile } from '@picsa/resources/schemas';
import { ResourcesToolService } from '@picsa/resources/services/resources-tool.service';
import { FadeInOut, FlyInOut } from '@picsa/shared/animations';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import { LOCALISED_MANUALS } from '../../data';
import { IManualPeriodEntryLocalised, IManualVariant } from '../../models';
@Component({
  selector: 'picsa-manual-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [FlyInOut({ axis: 'Y' }), FadeInOut({ inDelay: 200, inSpeed: 300 })],
  standalone: false,
})
export class HomeComponent implements OnDestroy {
  public manualDoc = signal<RxDocument<IResourceFile> | undefined>(undefined);
  public manualContents = signal<IManualPeriodEntryLocalised[]>([]);

  public pageNumber = signal<number | undefined>(undefined);
  public pdfSrc = signal<string | undefined>(undefined);

  public showDownloadPrompt = signal(false);

  public manualVariant = signal(this.getManualVersion());

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private resourcesService: ResourcesToolService,
  ) {
    this.route.queryParams.pipe(takeUntil(this.componentDestroyed$)).subscribe(({ page }) => {
      this.pageNumber.set(Number(page));
    });
    this.resourcesService.ready();
  }

  /** Prompt manual load if resource file attachment updated */
  public async handleManualDownloaded(uri: string) {
    if (uri) {
      this.showDownloadPrompt.set(false);
      this.pdfSrc.set(uri);
    }
  }

  public async handleManualSelected(e: { manual: IResourceFile; contents: IManualPeriodEntryLocalised[] }) {
    const { contents, manual } = e;
    this.manualContents.set(contents);
    this.loadManual(manual);
  }

  /**
   * Read local language setting and manual version preference to determine which version of the manual
   * to attempt loading
   */
  private async loadManual(manual: IResourceFile) {
    await this.resourcesService.ready();

    const manualDoc = await this.resourcesService.dbFiles.findOne(manual.id).exec();
    this.manualDoc.set(manualDoc || undefined);

    if (manualDoc) {
      const uri = await this.resourcesService.getFileAttachmentURI(manualDoc, true);
      if (uri) {
        this.showDownloadPrompt.set(false);
        this.pdfSrc.set(uri);
        return;
      }
    }
    this.showDownloadPrompt.set(true);
  }

  public async setSelectedTab(index: number) {
    this.pdfSrc.set(undefined);
    const version = index === 1 ? 'farmer' : 'extension';
    this.setManualVersion(version);
  }

  /** use localstorage to track farmer version preference */
  private getManualVersion(): IManualVariant {
    return localStorage.getItem('manual_version') === 'farmer' ? 'farmer' : 'extension';
  }
  private setManualVersion(version: IManualVariant) {
    return localStorage.setItem('manual_version', version);
  }

  ngOnDestroy() {
    // revoke any created object uris (use timeout to avoid destroy while still in use)
    setTimeout(() => {
      this.resourcesService.revokeFileAttachmentURIs([
        ...Object.values(LOCALISED_MANUALS.extension).map((manual) => manual.filename),
        ...Object.values(LOCALISED_MANUALS.farmer).map((manual) => manual.filename),
      ]);
    }, 500);
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}

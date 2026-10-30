import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { PicsaBackButtonComponent } from '@picsa/components/back-button.component';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PdfViewerComponent, PicsaPDFViewerService } from '@picsa/shared/features/pdf-viewer';
import { RxDocument } from 'rxdb';

import { ResourceDownloadComponent, ResourceItemVideoComponent, ResourceShareComponent } from '../../components';
import { IResourceFile } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

/** Full-screen viewer for resources that have been downloaded to the device */
@Component({
  selector: 'resource-downloads-viewer',
  templateUrl: './downloads-viewer.page.html',
  styleUrls: ['./downloads-viewer.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PicsaTranslateModule,
    MatButtonModule,
    MatIconModule,
    PicsaBackButtonComponent,
    PdfViewerComponent,
    ResourceDownloadComponent,
    ResourceItemVideoComponent,
    ResourceShareComponent,
  ],
})
export class DownloadsViewerPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private componentsService = inject(PicsaCommonComponentsService);
  private pdfViewerService = inject(PicsaPDFViewerService);
  private service = inject(ResourcesToolService);

  public doc = signal<RxDocument<IResourceFile> | null>(null);

  /** PDF source for the in-app viewer (blob on web, file uri on native) */
  public pdfSrc = signal<string | Blob | null>(null);

  /** Video source for the in-app player (file uri on native, blob url on web) */
  public videoSrc = signal<string | null>(null);

  /** Attachment no longer available locally (deleted, or opened from a stale link) */
  public needsDownload = signal(false);

  /** Device webview cannot render pdf, so offer to open with an external application instead */
  public unsupported = signal(false);

  public errorMessage = signal('');

  /** Pre-resolved uri for external open, so browser popup blockers see a user-initiated action */
  private externalUri: string | null = null;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return this.errorMessage.set('Resource not found');

    await this.service.ready();
    const doc = await this.service.dbFiles.findOne(id).exec();
    if (!doc) return this.errorMessage.set('Resource not found');

    this.doc.set(doc);
    this.componentsService.setHeader({ title: doc.title });
    return this.loadResource(doc);
  }

  ngOnDestroy() {
    const doc = this.doc();
    if (doc) {
      this.service.revokeFileAttachmentURIs([doc.filename || doc.id]);
    }
  }

  /** Reload the viewer source once a missing download has completed */
  public handleDownloadStatusChange(dl: ResourceDownloadComponent) {
    const doc = this.doc();
    if (doc && dl.downloadStatus() === 'complete') {
      return this.loadResource(doc);
    }
    return;
  }

  public openExternally() {
    const doc = this.doc();
    if (!doc || !this.externalUri) return;
    return this.service.openFileResource(this.externalUri, doc.mimetype, doc.id);
  }

  private async loadResource(doc: RxDocument<IResourceFile>) {
    this.resetViewer();

    const attachment = await this.service.getResourceAttachmentDoc(doc);
    if (!attachment) return this.needsDownload.set(true);

    return doc.mimetype === 'application/pdf' ? this.loadPdf(doc) : this.loadVideo(doc);
  }

  private async loadPdf(doc: RxDocument<IResourceFile>) {
    await this.pdfViewerService.ready();
    if (!this.pdfViewerService.isCompatible) {
      // resolve uri now so external open stays within the original user gesture
      this.externalUri = await this.service.getFileAttachmentURI(doc, false);
      return this.unsupported.set(true);
    }
    // web passes raw blob to pdf.js to avoid blob url fetch/revocation issues
    const blob = await this.service.getFileAttachmentBlob(doc);
    if (blob) return this.pdfSrc.set(blob);

    const uri = await this.service.getFileAttachmentURI(doc, true);
    if (uri) return this.pdfSrc.set(uri);

    this.needsDownload.set(true);
  }

  private async loadVideo(doc: RxDocument<IResourceFile>) {
    const uri = await this.service.getFileAttachmentURI(doc, false);
    if (uri) return this.videoSrc.set(uri);

    this.needsDownload.set(true);
  }

  private resetViewer() {
    this.needsDownload.set(false);
    this.unsupported.set(false);
    this.pdfSrc.set(null);
    this.videoSrc.set(null);
    this.externalUri = null;
  }
}

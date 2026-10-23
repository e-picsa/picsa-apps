import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { PicsaCommonComponentsService } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaPDFViewerService } from '@picsa/shared/features/pdf-viewer';
import { of } from 'rxjs';

import { ResourcesToolService } from '../../services/resources-tool.service';
import { DownloadsViewerPageComponent } from './downloads-viewer.page';

describe('DownloadsViewerPageComponent', () => {
  let component: DownloadsViewerPageComponent;
  let fixture: ComponentFixture<DownloadsViewerPageComponent>;

  let currentDoc: any;
  let mockPDFViewerService: { ready: jest.Mock; ready$: any; isCompatible: boolean };

  const mockResourcesToolService = {
    ready: jest.fn().mockResolvedValue(true),
    dbFiles: {
      findOne: jest.fn(() => ({ exec: jest.fn(() => Promise.resolve(currentDoc)) })),
    },
    getResourceAttachmentDoc: jest.fn().mockResolvedValue({}),
    getFileAttachmentBlob: jest.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
    getFileAttachmentURI: jest.fn().mockResolvedValue('blob:file-uri'),
    revokeFileAttachmentURIs: jest.fn(),
    openFileResource: jest.fn(),
  };

  function createComponent(doc: any) {
    currentDoc = doc;
    fixture = TestBed.createComponent(DownloadsViewerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  /** Wait for the async ngOnInit load chain to complete (testbed is zoneless, so whenStable is not enough) */
  function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve));
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPDFViewerService = { ready: jest.fn().mockResolvedValue(true), ready$: of(true), isCompatible: true };

    await TestBed.configureTestingModule({
      imports: [DownloadsViewerPageComponent, PicsaTranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'resource-1' } } },
        },
        { provide: FileOpener, useValue: {} },
        { provide: ResourcesToolService, useValue: mockResourcesToolService },
        { provide: PicsaPDFViewerService, useValue: mockPDFViewerService },
      ],
    }).compileComponents();
  });

  it('should load downloaded pdf as blob and set the header title', async () => {
    const setHeaderSpy = jest.spyOn(TestBed.inject(PicsaCommonComponentsService), 'setHeader');
    createComponent({ id: 'pdf-1', title: 'Test Manual', filename: 'manual.pdf', mimetype: 'application/pdf' });
    await settle();

    expect(component.pdfSrc()).toBeInstanceOf(Blob);
    expect(setHeaderSpy).toHaveBeenCalledWith({ title: 'Test Manual' });
  });

  it('should revoke attachment uris on destroy', async () => {
    createComponent({ id: 'pdf-1', title: 'Test Manual', filename: 'manual.pdf', mimetype: 'application/pdf' });
    await settle();

    fixture.destroy();

    expect(mockResourcesToolService.revokeFileAttachmentURIs).toHaveBeenCalledWith(['manual.pdf']);
  });

  it('should load downloaded video with a non-converted uri', async () => {
    createComponent({ id: 'video-1', title: 'Test Video', filename: 'video.mp4', mimetype: 'video/mp4' });
    await settle();

    expect(component.videoSrc()).toEqual('blob:file-uri');
    expect(mockResourcesToolService.getFileAttachmentURI).toHaveBeenCalledWith(expect.anything(), false);
  });

  it('should prompt download when attachment no longer available', async () => {
    mockResourcesToolService.getResourceAttachmentDoc.mockResolvedValueOnce(null);
    createComponent({ id: 'pdf-1', title: 'Test Manual', filename: 'manual.pdf', mimetype: 'application/pdf' });
    await settle();

    expect(component.needsDownload()).toBe(true);
    expect(component.pdfSrc()).toBeNull();
  });

  it('should offer external open when the pdf viewer is not compatible', async () => {
    mockPDFViewerService.isCompatible = false;
    createComponent({ id: 'pdf-1', title: 'Test Manual', filename: 'manual.pdf', mimetype: 'application/pdf' });
    await settle();

    expect(component.unsupported()).toBe(true);
    expect(component.pdfSrc()).toBeNull();

    component.openExternally();
    expect(mockResourcesToolService.openFileResource).toHaveBeenCalledWith('blob:file-uri', 'application/pdf', 'pdf-1');
  });

  it('should show an error when the resource cannot be found', async () => {
    createComponent(null);
    await settle();

    expect(component.errorMessage()).toEqual('Resource not found');
  });
});

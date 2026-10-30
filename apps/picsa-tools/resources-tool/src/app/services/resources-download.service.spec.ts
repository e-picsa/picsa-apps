import { TestBed } from '@angular/core/testing';
import { PicsaTranslateService } from '@picsa/i18n';
import { PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { ErrorHandlerService } from '@picsa/shared/services/core/error-handler.service';
import { FileService } from '@picsa/shared/services/core/file.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { RxDocument } from 'rxdb';
import { Subject, Subscription } from 'rxjs';

import { IResourceFile } from '../schemas';
import { ResourcesDownloadService } from './resources-download.service';

describe('ResourcesDownloadService', () => {
  let service: ResourcesDownloadService;
  let updatesMap: Map<string, Subject<{ progress: number; data?: Blob }>>;
  let mockFileService: Partial<FileService>;
  let mockAttachmentService: Partial<PicsaDatabaseAttachmentService>;
  let mockErrorHandler: { handleError: jest.Mock };
  let mockNotificationService: { showErrorNotification: jest.Mock };
  let mockTranslateService: { instant: jest.Mock };

  const createMockDoc = (id = 'res-1', url = 'https://example.com/video-1.mp4') =>
    ({
      id,
      url,
      filename: `${id}.mp4`,
      size_kb: 1024,
      allAttachments: () => [],
      getAttachment: () => null,
    }) as unknown as RxDocument<IResourceFile>;

  beforeEach(() => {
    updatesMap = new Map();
    mockFileService = {
      downloadFile: jest.fn().mockImplementation((url: string) => {
        const subject = new Subject<{ progress: number; data?: Blob }>();
        updatesMap.set(url, subject);
        return {
          subscription: new Subscription(),
          updates$: subject.asObservable(),
        };
      }),
    };

    mockAttachmentService = {
      getFileAttachmentURI: jest.fn().mockResolvedValue({}),
      revokeFileAttachmentURIs: jest.fn(),
      putAttachment: jest.fn(),
    };

    mockErrorHandler = {
      handleError: jest.fn().mockResolvedValue(undefined),
    };

    mockNotificationService = {
      showErrorNotification: jest.fn(),
    };

    mockTranslateService = {
      instant: jest.fn().mockImplementation((text: string) => text),
    };

    TestBed.configureTestingModule({
      providers: [
        ResourcesDownloadService,
        { provide: FileService, useValue: mockFileService },
        { provide: PicsaDatabaseAttachmentService, useValue: mockAttachmentService },
        { provide: ErrorHandlerService, useValue: mockErrorHandler },
        { provide: PicsaNotificationService, useValue: mockNotificationService },
        { provide: PicsaTranslateService, useValue: mockTranslateService },
      ],
    });

    service = TestBed.inject(ResourcesDownloadService);
  });

  it('resolves null, sets status to error, and notifies user without forwarding to ErrorHandler when connection drops', async () => {
    const doc = createMockDoc();
    const entry = await service.register(doc);

    expect(entry.status()).toBe('ready');

    const downloadPromise = entry.download();
    await Promise.resolve();
    expect(entry.status()).toBe('pending');

    updatesMap.get(doc.url)!.error({
      name: 'HttpErrorResponse',
      message: 'Http failure response for https://example.com/video-1.mp4: 0 Unknown Error',
      status: 0,
    });

    const result = await downloadPromise;
    expect(result).toBeNull();
    expect(entry.status()).toBe('error');
    expect(mockErrorHandler.handleError).not.toHaveBeenCalled();
    expect(mockNotificationService.showErrorNotification).toHaveBeenCalledWith(
      'Download Failed. Check internet connection and try again',
    );
  });

  it('forwards invalid storage link errors (e.g. 404/400) to ErrorHandlerService while resolving null', async () => {
    const doc = createMockDoc('res-404', 'https://supabase.co/storage/v1/object/public/broken.mp4');
    const entry = await service.register(doc);

    const downloadPromise = entry.download();
    await Promise.resolve();

    const notFoundError = {
      name: 'HttpErrorResponse',
      message: 'Http failure response for https://supabase.co/storage/v1/object/public/broken.mp4: 404 Not Found',
      status: 404,
    };
    updatesMap.get(doc.url)!.error(notFoundError);

    const result = await downloadPromise;
    expect(result).toBeNull();
    expect(entry.status()).toBe('error');
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(notFoundError);
    expect(mockNotificationService.showErrorNotification).toHaveBeenCalledTimes(1);
  });

  it('shows only a single error notification when multiple downloads fail in queueMultiple', async () => {
    const doc1 = createMockDoc('res-1', 'https://example.com/video-1.mp4');
    const doc2 = createMockDoc('res-2', 'https://example.com/video-2.mp4');

    const queue = await service.queueMultiple([doc1, doc2], 2);
    await Promise.resolve();

    updatesMap.get(doc1.url)!.error({
      name: 'HttpErrorResponse',
      message: 'Http failure response: 0 Unknown Error',
      status: 0,
    });
    updatesMap.get(doc2.url)!.error({
      name: 'HttpErrorResponse',
      message: 'Http failure response: 0 Unknown Error',
      status: 0,
    });

    await queue.onIdle();

    expect(mockNotificationService.showErrorNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationService.showErrorNotification).toHaveBeenCalledWith(
      'Download Failed. Check internet connection and try again',
    );
  });
});

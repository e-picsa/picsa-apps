import { TestBed } from '@angular/core/testing';
import { PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { FileService } from '@picsa/shared/services/core/file.service';
import { RxDocument } from 'rxdb';
import { Subject, Subscription } from 'rxjs';

import { IResourceFile } from '../schemas';
import { ResourcesDownloadService } from './resources-download.service';

describe('ResourcesDownloadService', () => {
  let service: ResourcesDownloadService;
  let updates$: Subject<{ progress: number; data?: Blob }>;
  let mockFileService: Partial<FileService>;
  let mockAttachmentService: Partial<PicsaDatabaseAttachmentService>;

  const createMockDoc = (id = 'res-1', url = 'https://example.com/video-1.mp4') =>
    ({
      id,
      url,
      filename: 'video-1.mp4',
      size_kb: 1024,
      allAttachments: () => [],
      getAttachment: () => null,
    }) as unknown as RxDocument<IResourceFile>;

  beforeEach(() => {
    updates$ = new Subject();
    mockFileService = {
      downloadFile: jest.fn().mockImplementation(() => ({
        subscription: new Subscription(),
        updates$: updates$.asObservable(),
      })),
    };

    mockAttachmentService = {
      getFileAttachmentURI: jest.fn().mockResolvedValue({}),
      revokeFileAttachmentURIs: jest.fn(),
      putAttachment: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ResourcesDownloadService,
        { provide: FileService, useValue: mockFileService },
        { provide: PicsaDatabaseAttachmentService, useValue: mockAttachmentService },
      ],
    });

    service = TestBed.inject(ResourcesDownloadService);
  });

  it('resolves null and sets status to error without unhandled rejection when download fails', async () => {
    const doc = createMockDoc();
    const entry = await service.register(doc);

    expect(entry.status()).toBe('ready');

    const downloadPromise = entry.download();
    await Promise.resolve();
    expect(entry.status()).toBe('pending');

    updates$.error({
      name: 'HttpErrorResponse',
      message: 'Http failure response for https://example.com/video-1.mp4: 0 Unknown Error',
      status: 0,
    });

    const result = await downloadPromise;
    expect(result).toBeNull();
    expect(entry.status()).toBe('error');
  });
});

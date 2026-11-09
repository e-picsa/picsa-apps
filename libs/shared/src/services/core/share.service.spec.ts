import { TestBed } from '@angular/core/testing';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import { NativeStorageService } from '../native';
import { ShareService } from './share.service';

jest.mock('@capacitor/core', () => {
  const actual = jest.requireActual('@capacitor/core');
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      isNativePlatform: jest.fn(),
    },
    registerPlugin: jest.fn().mockReturnValue({}),
  };
});

jest.mock('@capacitor/filesystem', () => ({
  Directory: {
    Data: 'DATA',
    Cache: 'CACHE',
  },
  Filesystem: {
    getUri: jest.fn(),
    copy: jest.fn(),
    deleteFile: jest.fn(),
  },
}));

jest.mock('@capacitor/share', () => ({
  Share: {
    share: jest.fn(),
  },
}));

describe('ShareService & NativeStorageService.copyFileToCache', () => {
  let shareService: ShareService;
  let nativeStorageService: NativeStorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

    TestBed.configureTestingModule({
      providers: [ShareService, NativeStorageService, { provide: FileOpener, useValue: { open: jest.fn() } }],
    });

    shareService = TestBed.inject(ShareService);
    nativeStorageService = TestBed.inject(NativeStorageService);
  });

  describe('NativeStorageService.copyFileToCache', () => {
    it('decodes percent-encoded URI paths and strips leading slashes before copying', async () => {
      (Filesystem.getUri as jest.Mock).mockResolvedValue({
        uri: 'file:///data/user/0/io.picsa.extension/files',
      });
      (Filesystem.copy as jest.Mock).mockResolvedValue({
        uri: 'file:///data/user/0/io.picsa.extension/cache/Guide%20to%20Maize%20Production%20_%20Final%20%40%40%20With%20Cover.pdf',
      });

      const encodedUri =
        'file:///data/user/0/io.picsa.extension/files/picsa_extension/resources_tool_files/Guide%20to%20Maize%20Production%20_%20Final%20%40%40%20With%20Cover.pdf';
      const targetFilename = 'Guide%20to%20Maize%20Production%20_%20Final%20%40%40%20With%20Cover.pdf';

      await nativeStorageService.copyFileToCache(encodedUri, targetFilename);

      expect(Filesystem.copy).toHaveBeenCalledWith({
        from: 'picsa_extension/resources_tool_files/Guide to Maize Production _ Final @@ With Cover.pdf',
        directory: Directory.Data,
        to: 'Guide to Maize Production _ Final @@ With Cover.pdf',
        toDirectory: Directory.Cache,
      });
    });
  });

  describe('ShareService.shareFromAttachments (native)', () => {
    it('decodes percent-encoded filenames from attachment URIs and preserves custom title', async () => {
      (Filesystem.getUri as jest.Mock).mockResolvedValue({
        uri: 'file:///data/user/0/io.picsa.extension/files',
      });
      (Filesystem.copy as jest.Mock).mockResolvedValue({
        uri: 'file:///data/user/0/io.picsa.extension/cache/FAW%20Mangement%20for%20maize.pdf',
      });
      (Share.share as jest.Mock).mockResolvedValue({});

      const mockAttachmentDoc = {
        _data: {
          id: 'resources_tool_files||FAW Mangement for maize.pdf',
          type: 'application/pdf',
          uri: 'file:///data/user/0/io.picsa.extension/files/picsa_extension/resources_tool_files/FAW%20Mangement%20for%20maize.pdf',
        },
      } as any;

      await shareService.shareFromAttachments([mockAttachmentDoc], { title: 'Custom Title' });

      expect(Filesystem.copy).toHaveBeenCalledWith({
        from: 'picsa_extension/resources_tool_files/FAW Mangement for maize.pdf',
        directory: Directory.Data,
        to: 'FAW Mangement for maize.pdf',
        toDirectory: Directory.Cache,
      });
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Custom Title',
          files: ['file:///data/user/0/io.picsa.extension/cache/FAW%20Mangement%20for%20maize.pdf'],
        }),
      );
    });

    it('defaults title to decoded filename when opts.title is omitted for a single file', async () => {
      (Filesystem.getUri as jest.Mock).mockResolvedValue({
        uri: 'file:///data/user/0/io.picsa.extension/files',
      });
      (Filesystem.copy as jest.Mock).mockResolvedValue({
        uri: 'file:///data/user/0/io.picsa.extension/cache/Plant%20Pests%20and%20Diseases%20Act.pdf',
      });
      (Share.share as jest.Mock).mockResolvedValue({});

      const mockAttachmentDoc = {
        _data: {
          id: 'resources_tool_files||Plant Pests and Diseases Act.pdf',
          type: 'application/pdf',
          uri: 'file:///data/user/0/io.picsa.extension/files/picsa_extension/resources_tool_files/Plant%20Pests%20and%20Diseases%20Act.pdf',
        },
      } as any;

      await shareService.shareFromAttachments([mockAttachmentDoc]);

      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Plant Pests and Diseases Act.pdf',
        }),
      );
    });
  });
});

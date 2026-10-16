import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from '@picsa/environments';
import { APP_VERSION } from '@picsa/environments/src/version';
import * as Sentry from '@sentry/angular';

import { initSentry, SentryService } from './sentry.service';

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: jest.fn().mockReturnValue('web'),
    isNativePlatform: jest.fn().mockReturnValue(false),
  },
}));

jest.mock('@capacitor/device', () => ({
  Device: {
    getId: jest.fn().mockResolvedValue({ identifier: 'test-device-uuid' }),
  },
}));

jest.mock('@sentry/angular', () => ({
  init: jest.fn(),
  isEnabled: jest.fn(),
  captureException: jest.fn().mockReturnValue('mock-event-id'),
  captureMessage: jest.fn().mockReturnValue('mock-message-id'),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

describe('SentryService and initSentry', () => {
  let service: SentryService;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [SentryService],
    });
    service = TestBed.inject(SentryService);
  });

  describe('initSentry', () => {
    it('initializes Sentry when DSN is configured', async () => {
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: ENVIRONMENT.sentry?.dsn,
          release: APP_VERSION,
        }),
      );
      expect(Sentry.setTag).toHaveBeenCalledWith('platform', 'web');
      expect(Sentry.setTag).toHaveBeenCalledWith('isNative', 'false');

      // Allow microtask queue to run for Device.getId()
      await Promise.resolve();
      expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'test-device-uuid' });
    });

    it('filters out extension errors in beforeSend', () => {
      initSentry();
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      // Extension frame should be filtered out
      const extensionEvent = {
        exception: {
          values: [
            {
              stacktrace: {
                frames: [{ filename: 'chrome-extension://some-id/script.js' }],
              },
            },
          ],
        },
      };
      expect(beforeSend(extensionEvent)).toBeNull();

      // Normal application event should pass through
      const appEvent = {
        exception: {
          values: [
            {
              stacktrace: {
                frames: [{ filename: 'https://picsa.app/main.js' }],
              },
            },
          ],
        },
      };
      expect(beforeSend(appEvent)).toBe(appEvent);

      // DevTools noise should be filtered out
      const devToolsEvent = {
        message: 'Angular DevTools hook failed',
      };
      expect(beforeSend(devToolsEvent)).toBeNull();
    });
  });

  describe('SentryService methods', () => {
    it('delegates captureException when enabled', () => {
      (Sentry.isEnabled as jest.Mock).mockReturnValue(true);
      const error = new Error('Test error');
      const result = service.captureException(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, undefined);
      expect(result).toBe('mock-event-id');
    });

    it('returns undefined from captureException when disabled', () => {
      (Sentry.isEnabled as jest.Mock).mockReturnValue(false);
      const error = new Error('Test error');
      const result = service.captureException(error);

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('delegates captureMessage when enabled', () => {
      (Sentry.isEnabled as jest.Mock).mockReturnValue(true);
      const result = service.captureMessage('Test message');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', undefined);
      expect(result).toBe('mock-message-id');
    });

    it('delegates setUser, setTag, setExtra, addBreadcrumb when enabled', () => {
      (Sentry.isEnabled as jest.Mock).mockReturnValue(true);

      service.setUser({ id: 'user-123' });
      expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'user-123' });

      service.setTag('test-tag', 'val');
      expect(Sentry.setTag).toHaveBeenCalledWith('test-tag', 'val');

      service.setExtra('extra-key', { foo: 'bar' });
      expect(Sentry.setExtra).toHaveBeenCalledWith('extra-key', { foo: 'bar' });

      service.addBreadcrumb({ message: 'clicked button' });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({ message: 'clicked button' });
    });
  });
});

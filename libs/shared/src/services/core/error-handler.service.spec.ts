import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/angular';

import { CrashlyticsService } from './crashlytics.service';
import { ErrorHandlerService } from './error-handler.service';

jest.mock('@capacitor/core', () => {
  const actual = jest.requireActual('@capacitor/core');
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      isNativePlatform: jest.fn(),
    },
  };
});

jest.mock('@sentry/angular', () => ({
  isEnabled: jest.fn(),
  captureException: jest.fn(),
}));

jest.mock('stacktrace-js', () => ({
  fromError: jest.fn().mockResolvedValue([{ functionName: 'testFn', fileName: 'test.ts', lineNumber: 1 }]),
}));

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let mockCrashlyticsService: {
    ready: jest.Mock;
    recordException: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCrashlyticsService = {
      ready: jest.fn().mockResolvedValue(undefined),
      recordException: jest.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [ErrorHandlerService, { provide: CrashlyticsService, useValue: mockCrashlyticsService }],
    });

    service = TestBed.inject(ErrorHandlerService);
  });

  it('captures error in Sentry when Sentry is enabled', async () => {
    (Sentry.isEnabled as jest.Mock).mockReturnValue(true);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    const testError = new Error('Test web error');
    await service.handleError(testError);

    expect(Sentry.captureException).toHaveBeenCalledWith(testError);
    expect(mockCrashlyticsService.recordException).not.toHaveBeenCalled();
  });

  it('does not call Sentry.captureException when Sentry is disabled', async () => {
    (Sentry.isEnabled as jest.Mock).mockReturnValue(false);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    const testError = new Error('Test dev error');
    await service.handleError(testError);

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(mockCrashlyticsService.recordException).not.toHaveBeenCalled();
  });

  it('unwraps ngOriginalError before sending to Sentry', async () => {
    (Sentry.isEnabled as jest.Mock).mockReturnValue(true);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    const originalError = new Error('Original error');
    const wrappedError = { ngOriginalError: originalError, message: 'Wrapper error' };

    await service.handleError(wrappedError);

    expect(Sentry.captureException).toHaveBeenCalledWith(originalError);
  });

  it('logs to Crashlytics on native platform in addition to Sentry', async () => {
    (Sentry.isEnabled as jest.Mock).mockReturnValue(true);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

    const testError = new Error('Native crash error');
    await service.handleError(testError);

    expect(Sentry.captureException).toHaveBeenCalledWith(testError);
    expect(mockCrashlyticsService.ready).toHaveBeenCalled();
    expect(mockCrashlyticsService.recordException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Native crash error',
      }),
    );
  });

  it('handles Crashlytics logging failure gracefully without throwing', async () => {
    (Sentry.isEnabled as jest.Mock).mockReturnValue(true);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    mockCrashlyticsService.ready.mockRejectedValue(new Error('Crashlytics init failed'));

    const testError = new Error('Error with failing crashlytics');
    await expect(service.handleError(testError)).resolves.not.toThrow();
  });
});

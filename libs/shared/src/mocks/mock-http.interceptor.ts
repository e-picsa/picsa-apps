import { isPlatformBrowser } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Interface for Defining E2E Mocks
 */
export interface IE2EHttpMock {
  urlRegex: string;
  method: string;
  response: {
    bodyBase64?: string;
    bodyJson?: Record<string, unknown>;
    status?: number;
    headers?: Record<string, string>;
  };
}

/**
 * Mock interceptor used in e2e tests to redirect http requests to static resources
 */
@Injectable()
export class MockHttpInterceptor implements HttpInterceptor {
  private platformId = inject(PLATFORM_ID);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // 1. Check if we are in the browser (mocking only supported in browser)
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(req);
    }
    console.log('[MockHttpInterceptor] url', req.url);
    // 2. Check if mocks are enabled and configured in localStorage
    const mocksConfig = localStorage.getItem('E2E_HTTP_MOCKS');
    if (!mocksConfig) {
      return next.handle(req);
    }

    try {
      const config = JSON.parse(mocksConfig) as { matches: IE2EHttpMock[] };
      const match = config.matches.find((m) => {
        return req.method === m.method && new RegExp(m.urlRegex).test(req.url);
      });

      if (match) {
        console.log('[MockHttpInterceptor] match', match);
        // Construct body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let body: any = null;
        if (match.response.bodyBase64) {
          // Convert base64 to Blob
          // Convert base64 to Blob
          const byteArray = Uint8Array.from(atob(match.response.bodyBase64), (c) => c.charCodeAt(0));
          const contentType = match.response.headers?.['Content-Type'] || match.response.headers?.['content-type'];
          body = new Blob([byteArray], { type: contentType });
        } else if (match.response.bodyJson) {
          body = match.response.bodyJson;
        }

        return of(
          new HttpResponse({
            status: match.response.status || 200,
            body: body,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            headers: match.response.headers ? (new Headers(match.response.headers) as any) : undefined,
          }),
        ).pipe(delay(500));
      }
    } catch (e) {
      console.error('[MockHttpInterceptor] Error parsing mocks', e);
    }

    return next.handle(req);
  }
}

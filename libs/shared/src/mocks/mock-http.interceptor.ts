import { isPlatformBrowser } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, of } from 'rxjs';

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
        // Construct body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let body: any = null;
        if (match.response.bodyBase64) {
          // Convert base64 to Blob
          const byteCharacters = atob(match.response.bodyBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          body = new Blob([byteArray]);
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
        );
      }
    } catch (e) {
      console.error('[MockHttpInterceptor] Error parsing mocks', e);
    }

    return next.handle(req);
  }
}

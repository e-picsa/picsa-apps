import { isPlatformBrowser } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Mock interceptor used in e2e tests to redirect http requests to static resources
 */
@Injectable()
export class MockHttpInterceptor implements HttpInterceptor {
  private platformId = inject(PLATFORM_ID);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // 1. Check if we are in the browser
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(req);
    }
    // only mock remote assets
    const { url } = req;
    if (url.startsWith('https')) {
      // Redirect remote to mock assets
      if (url.endsWith('.mp4')) {
        console.log('[MockHttpInterceptor] Redirecting to mock asset:', url);
        const mockedReq = req.clone({
          url: 'assets/dummy-video.mp4',
        });
        return next.handle(mockedReq);
      }
    }

    return next.handle(req);
  }
}

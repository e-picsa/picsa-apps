/* eslint-disable @typescript-eslint/no-explicit-any */
if (typeof window !== 'undefined') {
  if (!(window as any).SVGPathElement) {
    (window as any).SVGPathElement = class SVGPathElement extends ((window as any).SVGElement || Object) {};
  }
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => 'blob:mock';
  }
}

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

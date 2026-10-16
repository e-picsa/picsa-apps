if (typeof window !== 'undefined' && !(window as any).SVGPathElement) {
  (window as any).SVGPathElement = class SVGPathElement extends ((window as any).SVGElement || Object) {};
}

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

if (typeof window !== 'undefined') {
  if (!(window as any).SVGPathElement) {
    (window as any).SVGPathElement = class SVGPathElement extends ((window as any).SVGElement || Object) {};
  }
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => '';
  }
}

// Polyfill for requestAnimationFrame
(globalThis as any).requestAnimationFrame = (callback) => setTimeout(callback, 0);
(globalThis as any).cancelAnimationFrame = (id) => clearTimeout(id);

globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

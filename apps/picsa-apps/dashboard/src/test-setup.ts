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

/**
 * Shared SVGO configuration for repository SVG optimization.
 *
 * Preset-default with `removeViewBox: false` to preserve scaling behaviour
 * across `<img>` and `<mat-icon>` consumers.
 *
 * Usage (CLI):
 *   svgo --config apps/picsa-scripts/src/media/svgo.config.mjs ...
 *
 * Usage (API):
 *   import { optimize } from 'svgo';
 *   import { SVGO_CONFIG } from './svgo.config';
 *   optimize(svgString, { ...SVGO_CONFIG, path: filePath });
 */
export const SVGO_CONFIG = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
  ],
} as const;

export default SVGO_CONFIG;

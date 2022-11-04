import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import { angularOutputTarget } from '@stencil/angular-output-target';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { visualizer } from 'rollup-plugin-visualizer';

let afterPlugins: any[] = [nodePolyfills()];

// TODO - want to avoid in server but show in prod build
let useVisualiser = false;
if (useVisualiser) {
  afterPlugins.push(visualizer({ open: true, emitFile: false }));
}

export const config: Config = {
  namespace: 'picsa-webcomponents',
  taskQueue: 'async',
  // https://github.com/ionic-team/stencil/issues/2332
  nodeResolve: {
    browser: true,
    preferBuiltins: true,
  },
  rollupPlugins: {
    after: afterPlugins,
  },
  outputTargets: [
    angularOutputTarget({
      // should match tsconfig path to webcomponents dist
      componentCorePackage: '@picsa/webcomponents',
      directivesProxyFile:
        '../../../libs/webcomponents-ngx/src/lib/generated/components.ts',
      directivesArrayFile:
        '../../../libs/webcomponents-ngx/src/lib/generated/index.ts',
      // includeImportCustomElements: true,
    }),
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      dir: '../../dist/libs/webcomponents/dist',
    },

    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      dir: '../../dist/libs/webcomponents/www',
      serviceWorker: null, // disable service workers
    },
  ],
  plugins: [sass()],
  testing: {
    browserHeadless: false,
  },
};

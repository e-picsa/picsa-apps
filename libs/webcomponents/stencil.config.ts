import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export const config: Config = {
  namespace: 'picsa-webcomponents',
  taskQueue: 'async',
  commonjs: {
    // namedExports: {
    //   'enketo-core': ['Form'],
    // },
  },
  // https://github.com/ionic-team/stencil/issues/2332
  nodeResolve: {
    browser: true,
    preferBuiltins: true,
  },
  rollupPlugins: {
    after: [nodePolyfills()],
  },
  outputTargets: [
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
};

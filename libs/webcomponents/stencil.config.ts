import { angularOutputTarget } from '@stencil/angular-output-target';
import type { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import fs from 'fs';
import { resolve } from 'path';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { visualizer } from 'rollup-plugin-visualizer';

// TODO - want to avoid in server but show in prod build
const useVisualiser = false;
const createBuildPackageJson = true;
// plugins target before node-resolve or after commonjs transform
const rollupPlugins: Config['rollupPlugins'] = {
  before: [],
  after: [nodePolyfills()],
};

setupBuild();

export const config: Config = {
  // use altered package.json to support monorepo builds
  namespace: 'picsa-webcomponents',
  taskQueue: 'async',
  // https://github.com/ionic-team/stencil/issues/2332
  nodeResolve: {
    browser: true,
    preferBuiltins: true,
  },
  rollupPlugins,
  outputTargets: [
    angularOutputTarget({
      // should match tsconfig path to webcomponents dist
      componentCorePackage: '@picsa/webcomponents',
      directivesProxyFile: '../../../libs/webcomponents-ngx/src/lib/generated/components.ts',
      directivesArrayFile: '../../../libs/webcomponents-ngx/src/lib/generated/index.ts',
      // includeImportCustomElements: true,
    }),
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      dir: '../../dist/libs/webcomponents/dist',
    },

    {
      type: 'dist-custom-elements',
      copy: [
        {
          src: '**/assets',
          dest: '../../libs/webcomponents/www/assets',
          warn: true,
        },
      ],
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
  plugins: [
    // Can also include global scss via injectGlobalPaths, but be careful of pathnames
    // https://github.com/ionic-team/stencil-sass/issues/49
    sass({
      // injectGlobalPaths: [resolve(__dirname, `src/global/style.scss`).replace(/\\/g, '/')],
    }),
  ],
  testing: {
    browserHeadless: false,
  },
};

function setupBuild() {
  // visualiser
  if (useVisualiser) {
    rollupPlugins.after.push(visualizer({ open: true, emitFile: false }));
  }

  // HACK - when building stencil expects relative paths from root dir, so
  // temporarily rewrite paths and then revert to relative from workspace
  if (createBuildPackageJson) {
    // copy existing package to tmp
    const pkgPath = resolve(__dirname, 'package.json');
    // rewrite pkgJson paths
    const pkgContents = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const modifiedContents = { ...pkgContents };
    Object.entries(pkgContents).forEach(([key, value]) => {
      const monorepoPrefix = '../../dist/libs/webcomponents/';
      if (typeof value === 'string' && value.startsWith(monorepoPrefix)) {
        modifiedContents[key] = value.replace(monorepoPrefix, './');
      }
    });
    fs.writeFileSync(pkgPath, JSON.stringify(modifiedContents, null, 2));
    // revert changes on end
    const cleanUp = () => fs.writeFileSync(pkgPath, JSON.stringify(pkgContents, null, 2) + '\n');
    process.on('SIGINT', () => cleanUp());
    process.on('exit', () => cleanUp());
    process.on('uncaughtException', () => cleanUp());
  }
  return rollupPlugins;
}

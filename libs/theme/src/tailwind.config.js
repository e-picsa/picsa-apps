const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/**
 * @type {import('tailwindcss').Config}
 * Base config used as preset in child modules
 */
const configBase = {
  theme: {
    extend: {},
    // only provide breakpoints for sm, md and lg, aligned to angular-material spec
    // https://material.angular.io/cdk/layout/overview
    screens: {
      sm: '600px',
      md: '960px',
      lg: '1280px',
    },
    // expose same colors as theme
    // https://www.freedium.cfd/https://medium.com/@icedlee337/how-to-integrate-tailwind-and-angular-material-themes-1591af005457
    colors: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-primary)',
      black: 'var(--color-black)',
    },
  },
  plugins: [],
  corePlugins: {
    // disable pre-flight plugin that removes base styles (backwards compatibility with existing app)
    // https://tailwindcss.com/docs/preflight#disabling-preflight
    preflight: false,
  },
};

/**
 * Generate a list of all filepath dependencies for a given project
 * This includes child dependencies (e.g. picsa-tools or common libs) as extracted by NX
 * It excludes webcomponents which bundle their own code
 *
 * This list is used by tailwind to identify what classes to include/exclude in bundling
 */
const getContentDependencies = (dirname) =>
  [join(dirname, 'src/**/!(*.stories|*.spec).{ts,html}'), ...createGlobPatternsForDependencies(dirname)].filter(
    (p) => !p.includes('webcomponents')
  );

/**
 * Generate a full tailwind configuration to use within any project or lib
 *
 * NOTE - whilst tailwind can use config `presets:[]` property to manage inheritence,
 * it is assumed easier (for now) to just generate a single config file and avoid tool-specific overrides
 * @type {import('tailwindcss').Config}
 */
const generateSharedTailwindConfig = (dirname) => {
  // when generating from child dir include generation of all project dependency paths

  /** @type {import('tailwindcss').Config} */
  const config = { ...configBase, content: getContentDependencies(dirname) };
  return config;
};

module.exports = generateSharedTailwindConfig;

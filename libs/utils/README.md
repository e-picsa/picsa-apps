# @picsa/utils

This library provides shared functional utility functions and helpers across the PICSA monorepo.

## Architectural Guidelines & Scope

### 1. Functional & Pure Where Possible
- Functions should focus on deterministic data transformations: input data $\rightarrow$ transformed output.
- Avoid hidden global state, side-effects, or hardcoded environment assumptions.

### 2. Dependency Isolation & Runtime Compatibility
This repository spans multiple execution environments with differing runtime constraints:
- **Browser**: Angular 21 application and Dashboard.
- **Node.js**: CLI automation, sync pipelines, and preprocessing scripts.
- **Deno**: Supabase Edge Functions.

To ensure clean interoperability without breaking standalone runtimes:

#### A. Dependency-Free Standalone Utilities
Files such as:
- `climate.utils.ts` (climate data pivoting, float rounding, capabilities, and audit diffing)
- `object.utils.ts` (cloning, deep merging, equality checks)
- `async.utils.ts` (promise utilities, timeouts)

These files rely **only** on standard JavaScript/TypeScript APIs (`Math`, `Array`, `Map`, `crypto.subtle`). They have **zero npm dependencies** and can be safely imported directly by Deno, Node CLI scripts, and the browser.

#### B. Platform- or Library-Dependent Utilities
Files that wrap root-level packages or platform APIs:
- `angular.ts` (requires `@angular/core`, `@angular/router`, `rxjs`)
- `data.ts` (requires `rxdb`, `papaparse`)
- `xlsx.ts` (requires `xlsx`)
- `xml.ts` (requires `fast-xml-parser`)

**Critical Rules**:
1. **Never export platform-specific or heavy packages from top-level `index.ts`** if doing so would prevent Node/Deno scripts from importing `@picsa/utils` (e.g. Angular modules breaking ts-node/tsx).
2. Consumers that need heavy or platform-specific utilities should import the specific file directly (e.g. `@picsa/utils/angular` or `@picsa/utils/xlsx`).
3. Deno edge functions and standalone Node scripts should import specific standalone utility files (e.g. `import { ... } from '@picsa/utils/climate.utils'`).

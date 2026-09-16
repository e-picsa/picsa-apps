# @picsa/models

This library contains shared, platform-agnostic TypeScript data models, domain entities, and contracts used across the PICSA monorepo (Mobile App, Dashboard, CLI scripts, and backend services).

## Architectural Guidelines & Scope

### 1. Pure TypeScript Types & Interfaces Only
- Every file in this package must contain **only type definitions** (`interface`, `type`, `enum`, or simple const metadata).
- **Zero runtime JavaScript execution**: files must not execute logic or instantiate state at import time.
- Pure TypeScript interfaces compile away to nothing in JavaScript bundles, eliminating bundle overhead and runtime side-effects.

### 2. Dependency Independence & Multi-Runtime Portability
- Models are consumed across heterogeneous runtimes: **Browser (Angular)**, **Node.js (CLI scripts)**, and **Deno (Supabase Edge Functions)**.
- **No runtime npm dependencies**: Models must never import runtime libraries.
- If external types are required (e.g. `c3.ChartConfiguration`), you **must** use `import type * as c3 from 'c3'` so the import is completely erased during compilation and never evaluated by Node or Deno.

### 3. Flat Directory Structure
- All model files reside directly in `libs/models/` (flat structure without nested `src/`), matching `libs/utils/`.
- The root `index.ts` re-exports all domain models.
- Consumers can import from `@picsa/models` (or `@picsa/models/<file>` if subpath targeting is needed).

# Codebase Map & Architecture

## High-Level Architecture

The project follows a "Super App" architecture where a main shell application (`apps/picsa-apps/app`) embeds multiple smaller, focused tools.

### Key Applications

- **`apps/picsa-apps/app` (The Super App)**
  - Acts as the main container/shell.
  - Manages navigation between sub-tools.
  - Handles global authentication and initial data sync.
- **`apps/picsa-tools/*` (The Tools)**
  - Independent "mini-apps" embedded within the Super App.
  - Examples: `budget-tool`, `climate-tool`, `crop-probability-tool`.
  - While they can be served individually for development, they are designed to run within the super-app context in production.

- **`apps/picsa-apps/app-native`**
  - A lightweight **Capacitor** wrapper.
  - Used to bundle the web-app for native distribution (Android, and potentially iOS in the future).
  - Contains native configuration and plugins.

- **`apps/picsa-apps/dashboard`**
  - A standalone web application.
  - **Purpose**: Admin interface / Dashboard to interact with the database (Supabase).
  - Used by admins to update reference data (crops, stations, etc.) used by the main app.
  - **Not** part of the mobile app bundle.

## Directory Structure

### `apps/`

Contains the deployable application entries described above.

### `libs/`

Contains the majority of the source code.

- **`libs/feature-*`**: Smart components and business logic features.
- **`libs/ui-*`**: Dumb/Presentational components.
- **`libs/util-*`**: Helpers, formatting, and pure functions.
- **`libs/data-*`**: Data access services, API clients, and state management.
- **`libs/shared`**: Code shared widely across multiple apps/tools.

### `tools/`

Custom Nx workspace scripts and generators.

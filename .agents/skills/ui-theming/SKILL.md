---
name: UI & Theming Guide
description: Tailwind CSS configuration and Angular Material component usage guidelines.
---

# UI & Theming Guide

## Tailwind CSS Configuration

The project uses a custom Tailwind configuration shared across apps, located at `libs/theme/src/tailwind.config.js`.

> [!TIP]
> The configuration **extends** the default Tailwind palette. You have access to standard colors, but **primary UI elements should use semantic tokens**.

### Color Usage Guidelines

- **Themed Elements (Buttons, Headers, Links):**
  ALWAYS use `primary`, `secondary`, `black`, or `white`. These map to CSS variables (e.g., `var(--color-primary)`), allowing the theme to change dynamically (e.g., client branding).

- **Neutrals & Status (Borders, Backgrounds, Alerts):**
  You may use standard Tailwind colors (e.g., `gray-200`, `red-500`, `emerald-600`) for specific UI states, borders, or neutral backgrounds where strict theming is not required.

### No Dark Mode Support

> [!WARNING]
> **Strictly DO NOT use Tailwind `dark:` variant classes** (e.g. `dark:text-white`, `dark:bg-neutral-800`, `dark:border-*`).
>
> - The application only supports light mode. All country themes (`libs/theme/src/themes/`) use `mat.m2-define-light-theme`.
> - `libs/theme/src/tailwind.config.js` does NOT specify `darkMode: 'class'`. Using `dark:*` causes Tailwind to evaluate against the user's OS/system `prefers-color-scheme: dark`. This turns text white or backgrounds dark inside a light-themed Material UI, causing text and controls to become completely unreadable.

## Component Usage

**Mandatory:** Use Angular Material components for all interactive elements (Buttons, Inputs, Icons, etc.) instead of native HTML elements.

**Version:** This workspace uses Angular Material **v21**. Ensure you use the modern, standalone component APIs and MDC-based styles.

- **Buttons:**
  - Use `matButton` (e.g. `<button matButton>`) or variants like `<button matButton="filled">`.
  - Avoid using legacy selectors like `mat-raised-button`, `mat-stroked-button`, `mat-flat-button`.
  - **Icon Buttons:** Use `matIconButton` (`<button matIconButton>`) instead of `mat-icon-button`.
- **Icons:** Use `<mat-icon>`.
  - **NEVER use Tailwind sizing or typography classes (`w-*`, `h-*`, `text-sm`, `text-base`, `text-[...]`, `!w-*`, `!h-*`, `!text-*`) on `<mat-icon>`.** Tailwind `text-*` utilities override `line-height` (e.g. `text-base` sets `line-height: 1.5rem`), misaligning and clipping glyphs inside Angular Material's `overflow: hidden` `.mat-icon` container.
  - Prefer default `24px` sizing, `<mat-icon inline>` for icons embedded in inline text (sets `font-size/height/width/line-height: inherit`; avoid inside flex containers with fixed dimensions or with `svgIcon`), or Material component tokens (`mat.menu-overrides`, `mat.chips-overrides`, `mat.list-overrides`).
  - When manually resizing `<mat-icon>` in component SCSS, set **`font-size`**, **`width`**, and **`height`** together to the same value (preserving `line-height: 1`), e.g.:
    ```scss
    mat-icon.badge-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 1;
    }
    ```
- **Inputs:** Use `MatFormField` with `matInput`.

Use Tailwind CSS for layout, spacing, and typography **around** the Material components, or to customize them via utility classes (e.g., margins), but prefer Material's native theming/colors (`color="primary"`) for the component state itself.

### Usage Examples

✅ **Correct (Themed Action):**

```html
<!-- Uses semantic color via Material theming -->
<button matButton="filled" color="primary">Save Changes</button>
```

✅ **Correct (Neutral/Status):**

```html
<!-- Uses specific gray/red for standard UI elements -->
<div class="border border-gray-200 bg-slate-50 p-4">
  <span class="text-red-600">Error: Invalid input</span>
</div>
```

❌ **Incorrect:**

```html
<!-- AVOID: Hardcoding theme colors that should be dynamic -->
<button class="bg-blue-600 text-white">Save Changes</button>
```

Refer to `libs/theme/src/tailwind.config.js` to see specifically which variables are mapped to `theme.extend.colors`.

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

## Component Usage

**Mandatory:** Use Angular Material components for all interactive elements (Buttons, Inputs, Icons, etc.) instead of native HTML elements.

**Version:** This workspace uses Angular Material **v21**. Ensure you use the modern, standalone component APIs and MDC-based styles.

- **Buttons:** Use `<button mat-button>`, `<button mat-flat-button>`, etc.
- **Icons:** Use `<mat-icon>`.
- **Inputs:** Use `MatFormField` with `matInput`.

Use Tailwind CSS for layout, spacing, and typography **around** the Material components, or to customize them via utility classes (e.g., margins), but prefer Material's native theming/colors (`color="primary"`) for the component state itself.

### Usage Examples

✅ **Correct (Themed Action):**

```html
<!-- Uses semantic color for branding -->
<button class="bg-primary text-white">Save Changes</button>
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

# Picsa Monorepo Code Assist Style Guide

> [!IMPORTANT]
> **AI Review Bot Instructions:** You are reviewing an **Angular 21** monorepo using **Angular Material 21 (MDC)**. You MUST adhere to the following rules when suggesting code changes or flagging issues in Pull Requests. 

## 1. Angular Material 21 (CRITICAL)

This project strictly uses modern, standalone Angular Material APIs. 
- **Buttons**: You **MUST NOT** suggest or flag legacy selectors like `mat-raised-button`, `mat-stroked-button`, `mat-flat-button`, or `mat-button`. The correct directive is `matButton` (e.g., `<button matButton="filled" color="primary">`). Do not flag `matButton` as a "duplicate attribute".
- **Icon Buttons**: Use `matIconButton` (`<button matIconButton>`) instead of `mat-icon-button`.
- **Inputs**: Use `MatFormField` with `matInput`.
- **Icons**: Use `<mat-icon>`.

## 2. Modern Angular 21 Architecture

This codebase is modern and relies heavily on Signals and Standalone components.
- **Signals First**: Use `input()` and `input.required()` instead of `@Input()`. Use `output()` instead of `@Output()`. Use `signal()` and `computed()` for state. 
- **Control Flow**: Enforce the new built-in control flow syntax (`@if`, `@for`, `@defer`, `@empty`). Do **NOT** suggest `*ngIf` or `*ngFor`.
- **Change Detection**: Components must use `ChangeDetectionStrategy.OnPush`.
- **Standalone**: All components are `standalone: true`.

## 3. UI & Theming (Tailwind CSS)

- **Semantic Variables**: Primary interactive elements should use Material's semantic colors (e.g., `color="primary"`, `color="secondary"`). 
- **Tailwind for Layout**: Use Tailwind CSS strictly for layout, spacing, typography, and neutral/status styling (e.g., `border-gray-200`, `text-red-600`) around the Material components. 
- **Avoid Hardcoding Theme Colors**: Do not hardcode CSS classes like `bg-blue-600` for primary actions; rely on Material's theming or CSS variables to allow the theme to change dynamically.

## 4. Internationalization (i18n)

- **Never Hardcode Text**: The app is translated into 20+ languages. Always use the `translate` pipe for user-facing text (e.g., `<button>{{ 'Share' | translate }}</button>`). Do not suggest hardcoded text strings in templates.

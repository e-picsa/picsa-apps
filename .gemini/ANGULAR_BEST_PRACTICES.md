# Angular 21 Best Practices & Senior Developer Guidelines

To ensure high-quality, maintainable, and modern code, adhere to the following guidelines. These are non-negotiable for new feature development.

## 1. Modern Reactivity: Signals First

Angular 21 relies heavily on **Signals** for fine-grained reactivity.

- **Inputs**: Use `input()` and `input.required()` instead of `@Input()`.

  ```typescript
  // DO
  readonly userId = input.required<string>();
  readonly options = input<Option[]>([])

  // DON'T
  @Input() userId!: string;
  ```

- **Queries**: Use `viewChild()`, `contentChildren()`, etc.
  ```typescript
  // DO
  readonly submitBtn = viewChild<ElementRef>('submit');
  ```
- **Outputs**: Use `output()` instead of `@Output()`.
  ```typescript
  // DO
  readonly validated = output<boolean>();
  ```
- **State**: Use `signal()` and `computed()` for local component state.
  ```typescript
  readonly count = signal(0);
  readonly doubleCount = computed(() => this.count() * 2);
  ```

## 2. Control Flow Syntax

Always use the built-in control flow syntax. It is more readable and performant than `*ngIf` and `*ngFor`.

```html
<!-- DO -->
@if (user(); as u) {
<user-card [user]="u" />
} @else {
<login-prompt />
} @for (item of items(); track item.id) {
<list-item [item]="item" />
} @empty {
<li>No items found</li>
}
```

## 3. RxJS Interop

While Signals are preferred for synchronous state, RxJS is still the standard for asynchronous streams (HTTP, WebSockets).

- Use `toSignal` to consume Observables in templates synchronously.
  ```typescript
  readonly users = toSignal(this.userService.getUsers(), { initialValue: [] });
  ```
- Use `toObservable` when you need to switch from a Signal to a Stream (e.g., for debounce).
  ```typescript
  toObservable(this.searchTerm)
    .pipe(debounceTime(300))
    .subscribe(...)
  ```

## 4. Component Architecture

- **Standalone Components**: All components must be `standalone: true`.
- **Imports**: explicity import only what you need.
- **Change Detection**: **ALWAYS** use `ChangeDetectionStrategy.OnPush`.
  ```typescript
  @Component({
      selector: 'app-feature',
      standalone: true,
      imports: [CommonModule, MatButtonModule],
      templateUrl: './feature.component.html',
      changeDetection: ChangeDetectionStrategy.OnPush
  })
  ```
- **Smart vs. Dumb**:
  - **Smart (Container)**: Talks to Services/Store, handles data fetching, passes data down.
  - **Dumb (Presentational)**: Receives data via `input()`, emits events via `output()`. No dependency injection of Services.

## 5. Performance Optimization

- **Deferrable Views**: Use `@defer` to lazy load non-critical components.
  ```html
  @defer (on viewport) {
  <heavy-chart />
  } @placeholder {
  <loading-spinner />
  }
  ```
- **Image Optimization**: Use `NgOptimizedImage` (`ngSrc`) instead of `src`.

## 6. Strict Typing

- **No `any`**: explicit types or generalized generics are required.
- **Strict Null Checks**: Handle `null` / `undefined` explicitly.
- **Zod**: Use Zod for runtime validation of external data (API responses, JSON files).

## 7. Styles

- **Tailwind First**: Use utility classes for layout (flex, grid), spacing (m-_, p-_), and typography.
- **Component Styles**: Use SCSS files only for complex, component-specific styles that are hard to express with Tailwind.

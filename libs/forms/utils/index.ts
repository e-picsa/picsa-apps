import { FieldTree } from '@angular/forms/signals';

/** Mark all controls within a FieldTree as touched for validation */
export function markAllAsTouched<T>(tree: FieldTree<T>): void {
  // 1. Mark the current node as touched
  if (typeof tree === 'function') {
    const state = tree();
    if (state && typeof state.markAsTouched === 'function') {
      state.markAsTouched();
    }

    // 2. Iterate through all properties to find child fields
    for (const key of Object.keys(tree)) {
      const child = tree[key];
      // If the property is a function, it's likely a nested FieldTree node
      if (typeof child === 'function') {
        markAllAsTouched(child);
      }
    }
  }
}

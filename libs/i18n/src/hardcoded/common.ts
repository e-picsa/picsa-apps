import type { ITranslationEntry } from '../types';

export const COMMON_ENTRIES: ITranslationEntry[] = ['Back', 'Close', 'Next', 'Save', 'Cancel', 'Delete', 'Edit'].map(
  (text) => ({
    text,
    tool: 'common',
    context: 'buttons',
  })
);

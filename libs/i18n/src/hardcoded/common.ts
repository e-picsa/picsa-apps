import type { ITranslationEntry } from '../types';

const buttons: ITranslationEntry[] = ['Back', 'Close', 'Next', 'Save', 'Cancel', 'Delete', 'Edit'].map((text) => ({
  text,
  tool: 'common',
  context: 'buttons',
}));

export const COMMON_ENTRIES = [...buttons];

export interface ITranslationEntry {
  /** case-sensitive string representation for translation */
  text: string;
  /** associated tool for context */
  tool: 'budget' | 'climate';
  /** additional context related to tool */
  context?: string;
}

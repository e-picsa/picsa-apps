export interface ITranslationEntry {
  /** case-sensitive string representation for translation */
  text: string;
  /** associated tool for context */
  tool: string;
  /** additional context related to tool */
  context?: string;
}

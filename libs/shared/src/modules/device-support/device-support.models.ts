export interface ICompatibilityWarning {
  message: string;
  severity: 'warning' | 'error';
  link?: string;
}

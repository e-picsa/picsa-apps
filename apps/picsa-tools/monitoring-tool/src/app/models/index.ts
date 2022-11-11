/** Enekto form definition as processed by Enketo Transformer */
interface IEnketoFormDefinition {
  enketoId: string;
  externalData?: any[];
  /** HTML form representation */
  form: string;
  hash: string;
  languageMap: any;
  maxSize?: number;
  media: any;
  model: string;
  /** Form theme - NOTE - currently only grid theme imported */
  theme: 'grid';
}
export interface IPicsaForm extends IEnketoFormDefinition {
  title: string;
  description: string;
}

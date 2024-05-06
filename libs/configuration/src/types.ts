import { IDeploymentId, IDeploymentSettings } from '@picsa/data/deployments';

// TODO - rename to Deployment
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IConfiguration {
  /** HACK - Re-export from deployment data */
  export type Settings = IDeploymentSettings;

  /** User-specific deploment settings */
  export interface UserSettings {
    /** ID of selected deployment configuration */
    activeDeployment: IDeploymentId;
    /** ID of selected language */
    language_code: string;
    /** Specify if using farmer or extension app variants */
    variant?: 'farmer' | 'extension';
  }
}

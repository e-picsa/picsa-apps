import type { Database } from '@picsa/server-types';

export type IDeploymentRow = Database['public']['Tables']['deployments']['Row'];

export type DeploymentAccessRequest = Database['public']['Tables']['deployment_access_requests'];

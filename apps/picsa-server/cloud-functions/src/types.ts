/** Default request object omits some of the available data */
export interface ICloudRequest extends Parse.Cloud.FunctionRequest<Parse.Cloud.Params> {
  log: any;
  ip: string;
  headers: any;
  functionName: string;
  context: any;
  level: string;
}

interface Params {
  [key: string]: any;
}

export interface IJobRequest<T extends Params = Params> {
  params: T;
  message: (response: any) => void;
  log: any;
  headers: any;
}

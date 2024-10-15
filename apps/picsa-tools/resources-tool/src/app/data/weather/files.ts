import { IResourceFile } from '../../schemas';

interface IDownscaledForecast extends IResourceFile {
  meta: {
    locationIds: string[];
  };
}

// HACK - forecasts now populated from 'data' directory
// TODO - remove all legacy forecasts

const downscaledForecasts: Record<string, IDownscaledForecast> = {};

const otherForecasts: Record<string, IDownscaledForecast> = {};

export default { downscaledForecasts, otherForecasts };

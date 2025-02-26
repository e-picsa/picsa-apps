import { getClient } from '../_shared/client.ts';
import { getJsonData } from '../_shared/request.ts';
import { JSONResponse } from '../_shared/response.ts';
import { apiClient } from './climate-forecast-db.ts';
import { IDBClimateForecastRow } from './types.ts';

interface IReqParams {
  /**
   * Max number of documents to retrieve. As requests are run in parallel smaller number
   * reduces server workload. Default 5
   */
  limit?: number;
}

/**
 * Handle downloading forecast files from api and populating to supabase storage entry
 * Checks DB for any entries without storage files and attempts to update
 */
export const forecastStorage = async (req: Request) => {
  // ensure api up and running before sending batched requests
  await apiClient.GET('/v1/status/');
  const params = await getJsonData<IReqParams>(req);
  const res = await new ForecastStorageUpdate().populateStorageFiles(params);
  return JSONResponse(res);
};

class ForecastStorageUpdate {
  supabaseClient = getClient();

  private get table() {
    return this.supabaseClient.from('forecasts');
  }

  async populateStorageFiles(params: IReqParams) {
    const { limit = 5 } = params;
    const pending = await this.listPendingFiles(limit);

    const updates: IDBClimateForecastRow[] = [];
    const errors: any[] = [];
    // TODO - make parallel and allow failure
    for (const { country_code, id } of pending) {
      const { data, error } = await this.storeForecast(country_code, id);
      if (error) {
        errors.push(error);
      }
      if (data) {
        updates.push(data);
      }
    }
    return { data: updates, error: errors };
  }

  /** Check all climate forecast db entries for any that are missing corresponding storage files */
  private async listPendingFiles(limit = 5) {
    const query = this.table.select('*').is('storage_file', null).order('id', { ascending: false }).limit(limit);
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data;
  }

  /** Retrieve forecast data from API, store to supabase storage and update DB */
  private async storeForecast(
    country_code: string,
    id: string
  ): Promise<{ data?: IDBClimateForecastRow; error?: any }> {
    const supabaseClient = getClient();
    // download from api
    const req = apiClient.GET('/v1/documents/{country}/{filepath}', {
      params: { path: { country: country_code as any, filepath: id } },
      parseAs: 'blob',
    });
    const { data: fileData, response: apiResponse, error: apiError } = await req;
    if (apiError) {
      return { error: apiError };
    }
    if (fileData) {
      // upload to supabase storage
      const contentType = apiResponse.headers.get('content-type') as string;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from(country_code)
        .upload(`climate/forecasts/${id}`, fileData, { contentType, upsert: true });
      if (uploadError) {
        return { error: uploadError };
      }
      // update db entry
      const { data: updateData, error: updateError } = await this.updateForecastDBStorageEntry(id, uploadData.fullPath);
      if (updateError) {
        return { error: updateError };
      }
      return { data: updateData?.[0] };
    }
    return { error: `No filedata found for ${id}` };
  }

  private updateForecastDBStorageEntry(id: string, storage_file: string) {
    return this.table.update({ storage_file }).eq('id', id).select();
  }
}

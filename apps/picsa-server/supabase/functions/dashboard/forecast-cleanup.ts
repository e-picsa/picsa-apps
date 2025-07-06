import { getClient } from '../_shared/client.ts';
import { JSONResponse, ErrorResponse } from '../_shared/response.ts';

/**
 * Deletes forecasts (both DB and storage) older than 1 month
 */
export const forecastCleanup = async (_req: Request) => {
  const supabaseClient = getClient();

  // 1. Calculate the date for one month ago
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // 2. Query the `forecasts` table for entries older than that date
  const { data: oldForecasts, error: selectError } = await supabaseClient
    .from('forecasts')
    .select('id, country_code, storage_file')
    .lt('created_at', oneMonthAgo.toISOString());

  if (selectError) {
    return ErrorResponse({ error: selectError });
  }

  if (!oldForecasts || oldForecasts.length === 0) {
    return JSONResponse({ message: 'No old forecasts to delete.' });
  }

  const deletedFiles: string[] = [];
  const deletedDbEntries: string[] = [];
  const errors: CleanupError[] = [];

  // 3. Delete the corresponding files from storage and db
  for (const forecast of oldForecasts) {
    // Delete from storage if a file exists
    if (forecast.storage_file) {
      const { error: storageError } = await supabaseClient.storage
        .from(forecast.country_code)
        .remove([forecast.storage_file]);

      if (storageError) {
        errors.push({ id: forecast.id, error: storageError });
        console.error(`Error deleting storage file for ${forecast.id}:`, storageError);
      } else {
        deletedFiles.push(forecast.storage_file);
      }
    }

    // Delete from database
    const { error: dbError } = await supabaseClient.from('forecasts').delete().eq('id', forecast.id);

    if (dbError) {
      errors.push({ id: forecast.id, error: dbError });
      console.error(`Error deleting database entry for ${forecast.id}:`, dbError);
    } else {
      deletedDbEntries.push(forecast.id);
    }
  }

  if (errors.length > 0) {
    return ErrorResponse({
      message: 'Errors encountered during cleanup.',
      errors,
      deletedFiles,
      deletedDbEntries,
    });
  }

  return JSONResponse({
    message: 'Forecast cleanup successful.',
    deletedFiles,
    deletedDbEntries,
  });
};

interface CleanupError {
  id: string;
  error: unknown;
}

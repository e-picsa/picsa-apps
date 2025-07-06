import { getServiceRoleClient } from '../_shared/client.ts';
import { JSONResponse, ErrorResponse } from '../_shared/response.ts';

interface Forecast {
  id: string;
  country_code: string;
  storage_file?: string | null;
}

interface CleanupError {
  id: string;
  error: unknown;
}

/**
 * function to delete forecasts on both DB and storage older than 1 month
 */
export const forecastCleanup = async (_req: Request) => {
  const supabaseClient = getServiceRoleClient();

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

  // Type assertion for type safety
  const forecasts: Forecast[] = oldForecasts as Forecast[];

  const deletedFiles: string[] = [];
  const deletedDbEntries: string[] = [];
  const errors: CleanupError[] = [];

  // 3. Group forecasts for batch processing
  const forecastsWithFiles = forecasts.filter((f) => !!f.storage_file);
  const dbIdsForDeletion: string[] = forecasts.filter((f) => !f.storage_file).map((f) => f.id);

  // 4. Batch delete storage files and collect IDs of corresponding DB records for deletion
  if (forecastsWithFiles.length > 0) {
    const filesByCountry = forecastsWithFiles.reduce(
      (acc: Record<string, Forecast[]>, forecast) => {
        const country = forecast.country_code;
        if (!acc[country]) {
          acc[country] = [];
        }
        acc[country].push(forecast);
        return acc;
      },
      {} as Record<string, Forecast[]>,
    );

    const storagePromises = Object.entries(filesByCountry).map(async ([countryCode, forecasts]) => {
      const paths = forecasts.map((f) => f.storage_file!) as string[];
      const { data, error } = await supabaseClient.storage.from(countryCode).remove(paths);

      if (error) {
        forecasts.forEach((f) => errors.push({ id: f.id, error }));
        console.error(`Error deleting storage files for ${countryCode}:`, error);
        return;
      }

      const successfullyDeletedFiles = (data?.map((f: { name: string }) => f.name) ?? []) as string[];
      deletedFiles.push(...successfullyDeletedFiles);

      const idsToMarkForDeletion = forecasts
        .filter((f) => successfullyDeletedFiles.includes(f.storage_file!))
        .map((f) => f.id);

      dbIdsForDeletion.push(...idsToMarkForDeletion);
    });
    await Promise.all(storagePromises);
  }

  // 5. Batch delete database entries
  if (dbIdsForDeletion.length > 0) {
    const { error: dbError } = await supabaseClient.from('forecasts').delete().in('id', dbIdsForDeletion);

    if (dbError) {
      errors.push({ id: 'db-bulk-delete-failed', error: dbError });
      console.error('Error deleting database entries:', dbError);
    } else {
      deletedDbEntries.push(...dbIdsForDeletion);
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

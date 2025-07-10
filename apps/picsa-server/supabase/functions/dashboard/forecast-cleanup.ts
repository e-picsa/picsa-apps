import { getServiceRoleClient } from '../_shared/client.ts';
import { JSONResponse, ErrorResponse } from '../_shared/response.ts';
import type { IDBClimateForecastRow } from './types.ts';

interface CleanupError {
  id: string;
  error: unknown;
}

interface DeletedItem {
  id: string;
  storage_file: string | null;
}

/**
 * Deletes forecasts from database and storage that are older than one month.
 */
export const forecastCleanup = async (req: Request) => {
  // this is just for testing purposes for now
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }

  const supabaseClient = getServiceRoleClient();
  // calculate forecastes that are one month old
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const dateIdPrefix = `${oneMonthAgo.getFullYear()}${(oneMonthAgo.getMonth() + 1).toString().padStart(2, '0')}${oneMonthAgo.getDate().toString().padStart(2, '0')}`;

  console.log(`deleting forecasts older than: ${dateIdPrefix}`);

  // fetch old forecasts with storage files
  const { data: oldForecasts, error: selectError } = await supabaseClient
    .from('forecasts')
    .select('id, country_code, storage_file')
    .not('storage_file', 'is', null)
    .lt('id', dateIdPrefix);

  if (selectError) {
    console.error('Error querying forecasts:', selectError);
    return ErrorResponse({ error: selectError });
  }

  if (!oldForecasts?.length) {
    return JSONResponse({ message: 'No old forecasts found for deletion.' });
  }

  console.log(`found ${oldForecasts.length} forecasts for deletion`);
  const forecasts = oldForecasts as IDBClimateForecastRow[];
  const errors: CleanupError[] = [];
  const dbIdsForDeletion: string[] = [];

  // grouping forecasts by country for batch storage operations
  const filesByCountry = forecasts.reduce(
    (acc, forecast) => {
      const country = forecast.country_code;
      if (!acc[country]) acc[country] = [];
      acc[country].push(forecast);
      return acc;
    },
    {} as Record<string, IDBClimateForecastRow[]>,
  );

  // delete storage files and mark for database deletion
  await Promise.all(
    Object.entries(filesByCountry).map(async ([countryCode, forecastsInCountry]) => {
      // removing bucket prefix from storage paths (critical for proper deletion)
      const paths = forecastsInCountry.map((f) => f.storage_file!.replace(new RegExp(`^${countryCode}/`), ''));
      console.log(`Deleting ${paths.length} files from ${countryCode} bucket`);

      const { data, error } = await supabaseClient.storage.from(countryCode).remove(paths);

      if (error) {
        forecastsInCountry.forEach((f) => errors.push({ id: f.id, error }));
        console.error(`Storage deletion failed for ${countryCode}:`, error);
        return;
      }

      // this will makr all forecasts for database deletion if storage operation succeeded
      if (data !== null) {
        const idsToDelete = forecastsInCountry.map((f) => f.id);
        dbIdsForDeletion.push(...idsToDelete);
        console.log(`Storage deletion succeeded for ${countryCode}, marked ${idsToDelete.length} for DB deletion`);
      }
    }),
  );

  // delete database entries
  let deletedDbEntries: string[] = [];
  if (dbIdsForDeletion.length > 0) {
    const { data: deletedData, error: dbError } = await supabaseClient
      .from('forecasts')
      .delete()
      .in('id', dbIdsForDeletion)
      .select('id');

    if (dbError) {
      errors.push({ id: 'db-bulk-delete-failed', error: dbError });
      console.error('Database deletion failed:', dbError);
    } else {
      deletedDbEntries = deletedData?.map((d: { id: string }) => d.id) ?? [];
      console.log(`Successfully deleted ${deletedDbEntries.length} database entries`);
    }
  }

  // preparing the response items
  const successfullyDeletedItems: DeletedItem[] =
    deletedDbEntries.length > 0
      ? forecasts
          .filter((f) => deletedDbEntries.includes(f.id))
          .map((f) => ({ id: f.id, storage_file: f.storage_file }))
      : forecasts.map((f) => ({ id: f.id, storage_file: f.storage_file }));

  if (errors.length > 0) {
    return ErrorResponse({
      message: 'Some errors occurred during cleanup',
      errors,
      deletedItems: successfullyDeletedItems,
    });
  }

  console.log(`Cleanup completed: ${successfullyDeletedItems.length} items processed`);
  return JSONResponse({
    message: 'Forecast cleanup successful',
    deletedCount: successfullyDeletedItems.length,
    deletedItems: successfullyDeletedItems,
  });
};

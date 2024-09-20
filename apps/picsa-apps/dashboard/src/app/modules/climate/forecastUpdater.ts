import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

import { ENVIRONMENT } from '../../../../../../../libs/environments/src/index.ts';
import { PicsaNotificationService } from '../../../../../../../libs/shared/src/services/core/notification.service.ts';
import { SupabaseStorageService } from '../../../../../../../libs/shared/src/services/core/supabase/services/supabase-storage.service.ts';
import { ApiMapping } from './climate-api.mapping.ts';
import { IAPICountryCode } from './climate-api.mapping.ts';
import { ClimateApiService } from './climate-api.service.ts';

// function to initialize the Supabase client
const initializeSupabaseClient = async (): Promise<SupabaseClient> => {
  const { anonKey, apiUrl } = await ENVIRONMENT.supabase.load();
  return createClient(apiUrl, anonKey);
};

// function to initialize the necessary services
const initializeServices = (supabase: SupabaseClient) => {
  const mockMatSnackBar = {
    open: (message: string) => {
      console.log(`Mock Notification: ${message}`);
    },
  };

  const notificationService = new PicsaNotificationService(mockMatSnackBar as any);
  const storageService = new SupabaseStorageService(notificationService);
  storageService.registerSupabaseClient(supabase);

  const apiService = new ClimateApiService();
  return { apiService, storageService };
};

// handler to process the forecasts
const handleForecastUpdate = async (country_code: IAPICountryCode) => {
  try {
    const supabase = await initializeSupabaseClient();
    const { apiService, storageService } = initializeServices(supabase);

    // ApiMappings forecasts method to handle fetching and storing
    const apiMapping = ApiMapping(apiService, {} as any, supabase, storageService, {} as any);

    await apiMapping.forecasts(country_code);
    return new Response('Forecasts updated successfully', { status: 200 });
  } catch (error: any) {
    console.error('Error fetching or storing forecast:', error);
    return new Response(error.message, { status: 500 });
  }
};

// Main server function to trigger the forecast update
serve(async (req) => {
  const url = new URL(req.url);
  const country_code = (url.searchParams.get('country_code') || 'zw') as IAPICountryCode;
  return await handleForecastUpdate(country_code);
});

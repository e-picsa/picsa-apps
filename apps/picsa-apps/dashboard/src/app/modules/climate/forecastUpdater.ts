import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { ENVIRONMENT } from '@picsa/environments/src';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseStorageService } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

import { ApiMapping } from './climate-api.mapping';
import { IAPICountryCode } from './climate-api.mapping';
import { ClimateApiService } from './climate-api.service';

// helper function to initialize the Supabase client and services
const initializeSupabaseClient = async (): Promise<SupabaseClient> => {
  const { anonKey, apiUrl } = await ENVIRONMENT.supabase.load();
  return createClient(apiUrl, anonKey);
};

// helper function to initialize services
const initializeServices = (supabase: SupabaseClient) => {
  const mockMatSnackBar: Partial<MatSnackBar> = {
    open: (message: string, action: string, config?: MatSnackBarConfig) => {
      console.log(`Mock Notification: ${message}`);
      return {} as MatSnackBarRef<any>; // Mock return object
    },
  };

  const notificationService = new PicsaNotificationService(mockMatSnackBar as MatSnackBar);
  const storageService = new SupabaseStorageService(notificationService);
  storageService.registerSupabaseClient(supabase);

  const apiService = new ClimateApiService();
  return { apiService, storageService };
};

// edge function handler for processing forecasts
const handleForecastUpdate = async (country_code: IAPICountryCode) => {
  try {
    const supabase = await initializeSupabaseClient();
    const { apiService, storageService } = initializeServices(supabase);
    const apiMapping = ApiMapping(apiService, {}, supabase, storageService, {});

    // Fetch and store the forecast data for the given country code
    await apiMapping.forecasts(country_code);
    return new Response('Forecasts updated successfully', { status: 200 });
  } catch (error: any) {
    console.error('Error fetching or storing forecast:', error);
    return new Response(error.message, { status: 500 });
  }
};

// ** Main server function **
serve(async (req) => {
  // Extract country_code from query parameters or default to 'zw'
  const url = new URL(req.url);
  const country_code = (url.searchParams.get('country_code') || 'zw') as IAPICountryCode;

  // Call the forecast handler
  return await handleForecastUpdate(country_code);
});

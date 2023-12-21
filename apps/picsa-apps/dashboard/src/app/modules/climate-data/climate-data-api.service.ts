import { Injectable } from '@angular/core';
import createClient from 'openapi-fetch';

import { paths } from './types/api';

const API_ENDPOINT = 'https://api.epicsa.idems.international';

/** Service to interact with external PICSA Climate API */
@Injectable({ providedIn: 'root' })
export class ClimateDataApiService {
  
  /** Http client with type-definitions for API endpoints */
  public client:ReturnType<typeof createClient<paths>>
  
  constructor() {
    this.client = createClient<paths>({ baseUrl: API_ENDPOINT,mode:'cors' });
  }
}

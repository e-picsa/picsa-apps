// Whilst project has angular-redux throughout, also planning migration to mobx with initial modules

import { Injectable } from '@angular/core';
import { IData } from '../../models';
import INITIAL_DATA from '../services/storage.data';
import { StorageProvider } from '../services';

@Injectable({
  providedIn: 'root'
})
export class DataStore {
  storedData: any;
  constructor(private storagePrvdr: StorageProvider) {}

  public async getStoredData(endpoint: keyof IData) {
    const data = await this.storagePrvdr.get(endpoint);
    return data ? data : INITIAL_DATA[endpoint];
  }
}

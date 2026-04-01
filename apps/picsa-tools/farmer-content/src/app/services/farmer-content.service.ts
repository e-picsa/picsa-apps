import { inject, Injectable } from '@angular/core';
import { DataIconRegistry } from '@picsa/data/iconRegistry';

@Injectable({ providedIn: 'root' })
export class FarmerContentService {
  constructor() {
    const dataIconRegistry = inject(DataIconRegistry);

    dataIconRegistry.registerMatIcons('tools');
  }
}

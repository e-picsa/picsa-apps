import { Injectable } from '@angular/core';
import { PicsaCustomCardService } from '@picsa/shared/features/cards';

import { COLLECTION, ICalendarCard } from '../schema/cards';

/** Persists user-drawn custom crop and activity cards for the seasonal calendar */
@Injectable({ providedIn: 'root' })
export class SeasonalCalendarCardService extends PicsaCustomCardService<ICalendarCard> {
  protected collectionName = 'seasonal_calendar_cards' as const;
  protected collectionCreator = COLLECTION;
}

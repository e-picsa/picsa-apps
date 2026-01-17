import { inject,Injectable } from '@angular/core';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { PrintProvider } from '@picsa/shared/services/native';
import { RxCollection } from 'rxdb';

import { CalendarDataEntry, COLLECTION } from '../schema';

@Injectable({
  providedIn: 'root',
})
export class SeasonCalendarService extends PicsaAsyncService {
  private dbService = inject(PicsaDatabase_V2_Service);
  private printPrvdr = inject(PrintProvider);

  /** Provide database options tool collection (with typings) */
  public get dbCollection() {
    return this.dbService.db.collections['seasonal_calendar_tool'] as RxCollection<CalendarDataEntry>;
  }
  /** Provide database options tool collection filtered to active user */
  public get dbUserCollection() {
    return this.dbService.activeUserQuery(this.dbCollection);
  }

  /** Initialise collection required for storing data to database */
  public override async init() {
    await this.dbService.ensureCollections({
      seasonal_calendar_tool: COLLECTION,
    });
  }

  public async save(data: CalendarDataEntry) {
    return this.dbCollection.incrementalUpsert(data);
  }

  public async getCalendarById(id: string) {
    try {
      const result = await this.dbCollection
        .findOne({
          selector: {
            id: id,
          },
        })
        .exec();
      const calendar = result?._data;
      return calendar;
    } catch (err) {
      console.error('Failed to get calendar by name:', err);
      throw err;
    }
  }

  public async shareAsImage(title: string) {
    return this.printPrvdr.shareHtmlDom('#seasonalCalendar', 'Seasonal Calendar', title);
  }
}

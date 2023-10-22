import { Injectable } from '@angular/core';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { RxCollection, RxDocument, RxQuery } from 'rxdb';

import { CalendarDataEntry,COLLECTION } from '../schema';

@Injectable({
  providedIn: 'root',
})
export class SeasonCalenderService {
  constructor(private dbService: PicsaDatabase_V2_Service) {}

  /** Provide database options tool collection (with typings) */
  public get dbCollection() {
    return this.dbService.db.collections['seasonal_calender_tool'] as RxCollection<CalendarDataEntry>;
  }
  /** Provide database options tool collection filtered to active user */
  public get dbUserCollection() {
    return this.dbService.activeUserQuery(this.dbCollection);
  }

  /** Initialise collection required for storing data to database */
  public async initialise() {
    await this.dbService.ensureCollections({
      seasonal_calender_tool: COLLECTION,
    });
  }

  public async addORUpdateData(calender: any,insertionType:string) {
    try {
      //handles instertion and update as long as the name is the same.
      let transformedCalenderData;
      if(insertionType==='add'){
       transformedCalenderData = {
        name: calender.name,
        timeAndConditions: calender.timeAndConditions,
        crops: calender.crops.map((cropName) => ({
          name: cropName,
          months: calender.timeAndConditions.map((monthData) => ({
            month: monthData.month,
            activities: [], // Initially empty
          })),
          extraInformation: "",
        })),
      };
     }else{
      // the table could be used to edit more information about the calender
      transformedCalenderData = {
        name: calender.name,
        crops: calender.crops,
        timeAndConditions: calender.timeAndConditions
      }
     }

      const res = await this.dbCollection.incrementalUpsert(transformedCalenderData);
      console.log('[calender]', res._data);
    } catch (err) {
      alert('Failed to add data, please try again');
      console.error('calender.submit(): error:');
      throw err;
    }
  }

  public async deleteCalender(calendar: RxDocument<CalendarDataEntry>) {
    await calendar.remove();
  }

  public async getCalenderByName(name: string){
    try {
      const result = await this.dbCollection.findOne(
        {
          selector: {
            name: name
          }
        }
      ).exec()   
      const calendar = result?._data
      //console.log(calendar)
      if (calendar) {
        return calendar;
      } else {
        return null; 
      }
    } catch (err) {
      console.error('Failed to get calendar by name:', err);
      throw err;
    }
  }

}



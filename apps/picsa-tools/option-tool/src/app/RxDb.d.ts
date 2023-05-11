/**
 * custom typings so typescript knows about the schema-fields
 * @type {[type]}
 */

import { RxCollection, RxDatabase,RxDocument } from 'rxdb';
// import { Observable } from 'rxjs';

export interface RxOptionsDocumentType {
    practiceEntry: string;
    gender: string[];
    benefits: Benefit[];
    perfomanceValues: {
      lowRf: string;
      midRf: string;
      highRf: string;
    };
    performanceOptions: string[];
    investmentValues: {
      money: string;
      time: string;
    };
    investmentOptions: string[];
    benefitsStartTime: string;
    risk: string;
}

// ORM methods
// interface RxOptionsDocMethods {
// }

export type RxOptionsDocument = RxDocument<RxOptionsDocumentType>;

export type RxOptionsCollection = RxCollection<RxOptionsDocumentType, any>;

export interface RxOptionsCollections {
  option: RxOptionsCollection;
}

export type RxOptionsDatabase = RxDatabase<RxOptionsCollections>;

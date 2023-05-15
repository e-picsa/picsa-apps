/**
 * custom typings so typescript knows about the schema-fields
 * @type {[type]}
 */
import { RxCollection, RxDatabase,RxDocument } from 'rxdb';

export interface RxOptionsDocumentType {
  practice: string;
  gender: string[];
  benefits: { benefit: string; beneficiary: string[] }[];
  performance: { lowRf: string; midRf: string; highRf: string };
  investment: { money: string; time: string };
  time: string;
  risk: string;
}

// ORM methods
// interface RxOptionsDocMethods {
// }

export type RxOptionsDocument = RxDocument<RxOptionsDocumentType>;

export type RxOptionsCollection = RxCollection<RxOptionsDocumentType>;

export interface RxOptionsCollections {
  options: RxOptionsCollection;
}

export type RxOptionsDatabase = RxDatabase<RxOptionsCollections>;

interface Benefit {
  benefit: string;
  beneficiary: string[];
}

export interface IOptionsToolEntry_v0 {
  practice: string;
  gender: string[];
  benefits: Benefit[];
  performance: {
    lowRf: string;
    midRf: string;
    highRf: string;
  };
  investment: {
    money: string;
    time: string;
  };
  time: string;
  risk: string;
}

export type IOptionsToolEntry_v1 = IOptionsToolEntry_v0;

/**
 * RENAME 'gender' to 'gender_activities'
 * ADD 'gender_decisions'
 * ADD _id primary key
 * */
export interface IOptionsToolEntry_v2 extends Omit<IOptionsToolEntry_v1, 'gender'> {
  gender_decisions: string[];
  gender_activities: string[];
  _id: string;
}

/**
 * UPDATE 'risk' to take array of values
 * UPDATE 'time' to take both value and unit properties
 * */
export interface IOptionsToolEntry_v3 extends Omit<Omit<IOptionsToolEntry_v2, 'risk'>, 'time'> {
  risk: string[];
  time: { unit: 'month' | 'week' | 'day'; value: number | null };
  _id: string;
}

/**
 * ADD 'enterprise' and '_created_at' properties
 */
export interface IOptionsToolEntry_v4 extends IOptionsToolEntry_v3 {
  enterprise: 'crop' | 'livestock' | 'livelihood';
  _created_at: string;
}

/**
 * Rename time.value -> time.quantity for improved FormField compatibility
 * ("value" is a reserved property)
 */
export interface IOptionsToolEntry_v5 extends Omit<IOptionsToolEntry_v4, 'time'> {
  time: { unit: 'month' | 'week' | 'day'; quantity: number | null };
}

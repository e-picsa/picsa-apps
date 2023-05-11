import { RxJsonSchema } from 'rxdb';

interface Benefit {
  benefit: string;
  beneficiary: string[];
}

interface PracticeEntry {
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

const practiceEntrySchema: RxJsonSchema<PracticeEntry> = {
  title: 'practice entry schema',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    practiceEntry: {
        type: 'string',
        default: '', 
    },
    gender: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    benefits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          benefit: {
            type: 'string'
          },
          beneficiary: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        required: ['benefit', 'beneficiary']
      }
    },
    perfomanceValues: {
      type: 'object',
      properties: {
        lowRf: {
          type: 'string'
        },
        midRf: {
          type: 'string'
        },
        highRf: {
          type: 'string'
        }
      },
      required: ['lowRf', 'midRf', 'highRf']
    },
    performanceOptions: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['good', 'ok', 'bad']
      }
    },
    investmentValues: {
      type: 'object',
      properties: {
        money: {
          type: 'string'
        },
        time: {
          type: 'string'
        }
      },
      required: ['money', 'time']
    },
    investmentOptions: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['high', 'mid', 'low']
      }
    },
    benefitsStartTime: {
      type: 'string'
    },
    risk: {
      type: 'string'
    }
  },
  required: [
    'practiceEntry'
  ],
  primaryKey: 'practiceEntry'
};
export default practiceEntrySchema;
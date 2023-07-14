import { IMonitoringForm } from '../../src/app/schema/forms';

import ewMonitoringForm from './ew-monitoring.form';
import demoKitchenForm from './demo-kitchen.form';

export const HARDCODED_FORMS: IMonitoringForm[] = [
  {
    _id: 'ew_monitoring',
    title: 'Extension Worker Monitoring',
    description: '',
    enketoDefinition: ewMonitoringForm,
    summaryFields: [
      { field: 'Date', label: 'Date' },
      { field: 'Location', label: 'Location' },
      { field: 'Number_of_female_farmers_present', label: 'Female Farmers' },
      { field: 'Number_of_male_farmers_present', label: 'Male Farmers' },
    ],
  },

  {
    _id: 'demo_kitchen',
    title: 'Complex Demo Form',
    description: '',
    appCountries: ['global'],
    enketoDefinition: demoKitchenForm,
    summaryFields: [{ field: '_id', label: 'ID' }],
  },
];

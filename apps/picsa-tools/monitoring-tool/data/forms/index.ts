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
      { field: 'date', label: 'Date' },
      { field: 'district', label: 'District' },
      { field: 'location', label: 'Location' },
      { field: 'total_farmers', label: 'Total Farmers' },
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

import { IMonitoringForm } from '@picsa/monitoring/src/app/schema/forms';

import ewMonitoringForm from './ew-monitoring.form';
import demoKitchenForm from './demo-kitchen.form';

export const HARDCODED_FORMS: IMonitoringForm[] = [
  {
    _id: 'ew_monitoring',
    title: 'Extension Worker Monitoring',
    description: '',
    enketoDefinition: ewMonitoringForm,
  },

  {
    _id: 'demo_kitchen',
    title: 'Complex Demo Form',
    description: '',
    appCountries: ['global'],
    enketoDefinition: demoKitchenForm,
  },
];

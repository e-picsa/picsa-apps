import { IMonitoringForm } from '../../src/app/schema/forms';
import demoKitchenForm from './demo-kitchen.form';
import ewMonitoringFormMW from './ew-monitoring-mw.form';
import ewMonitoringFormZM from './ew-monitoring-zm.form';

export const HARDCODED_FORMS: IMonitoringForm[] = [
  {
    _id: 'ew_monitoring',
    title: 'Extension Worker Monitoring',
    description: 'Malawi',
    enketoDefinition: ewMonitoringFormMW,
    summaryFields: [
      { field: 'date', label: 'Date' },
      { field: 'district', label: 'District' },
      { field: 'EPA', label: 'EPA' },
      { field: 'section', label: 'Section' },
      { field: 'total_farmers', label: 'Total Farmers' },
    ],
    appCountries: ['mw', ''],
    cover: {
      icon: 'assets/svgs/monitoring-forms/ew-monitoring.svg',
    },
  },
  {
    _id: 'ew_monitoring_zm',
    title: 'Extension Worker Monitoring',
    description: 'Zambia',
    enketoDefinition: ewMonitoringFormZM,
    summaryFields: [
      { field: 'date', label: 'Date' },
      { field: 'district', label: 'District' },
      { field: 'EPA', label: 'EPA' },
      { field: 'section', label: 'Section' },
      { field: 'total_farmers', label: 'Total Farmers' },
    ],
    appCountries: ['zm', ''],
    cover: {
      icon: 'assets/svgs/monitoring-forms/ew-monitoring.svg',
    },
  },

  {
    _id: 'demo_kitchen',
    title: 'Complex Demo Form',
    description: '',
    appCountries: [''],
    enketoDefinition: demoKitchenForm,
    summaryFields: [{ field: '_id', label: 'ID' }],
    cover: {
      icon: '',
    },
  },
];

import { defineFeature } from '../../utils/route-utils';

const FeedbackFeature = defineFeature({
  path: 'feedback',
  nav: {
    label: 'Feedback',
    icon: 'feedback',
  },
  roleRequired: 'app.admin',

  children: [
    {
      path: '',
      pathMatch: 'full',
      loadComponent: () => import('./pages/list/feedback-list.component').then((m) => m.FeedbackListComponent),
      roleRequired: 'app.admin',
    },
    {
      path: ':id',
      loadComponent: () => import('./pages/detail/feedback-detail.component').then((m) => m.FeedbackDetailComponent),
      roleRequired: 'app.admin',
    },
  ],
});

export { FeedbackFeature };

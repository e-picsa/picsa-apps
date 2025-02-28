import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from './app/app.config';
import { ForecastComponent } from './app/pages/forecast/forecast.page';

bootstrapApplication(ForecastComponent, appConfig).catch((err) => console.error(err));

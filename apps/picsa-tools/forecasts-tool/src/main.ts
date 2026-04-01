import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaForecastsTool } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaForecastsTool, appConfig).catch((err) => console.error(err));

import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaMonitoringTool } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaMonitoringTool, appConfig).catch((err) => console.error(err));

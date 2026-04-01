import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaManualTool } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaManualTool, appConfig).catch((err) => console.error(err));

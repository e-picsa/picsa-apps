import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaBudgetTool } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaBudgetTool, appConfig).catch((err) => console.error(err));

import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaOptionTool } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaOptionTool, appConfig).catch((err) => console.error(err));

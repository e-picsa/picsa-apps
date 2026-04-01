import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaResourcesTool } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaResourcesTool, appConfig).catch((err) => console.error(err));

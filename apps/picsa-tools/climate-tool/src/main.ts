import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaClimateTool } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaClimateTool, appConfig).catch((err) => console.error(err));

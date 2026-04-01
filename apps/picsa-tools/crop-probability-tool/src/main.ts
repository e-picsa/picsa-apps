import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaCropProbabilityTool } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaCropProbabilityTool, appConfig).catch((err) => console.error(err));

import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaFarmerContent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaFarmerContent, appConfig).catch((err) => console.error(err));

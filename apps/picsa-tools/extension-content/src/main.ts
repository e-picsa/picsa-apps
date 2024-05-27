import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaExtensionContent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaExtensionContent, appConfig).catch((err) => console.error(err));

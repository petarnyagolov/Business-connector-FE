import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app.config';

bootstrapApplication(AppComponent, appConfig) // Ако имаш app.config.ts
  .catch((err) => console.error(err));
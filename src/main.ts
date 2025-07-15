import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app.config';
import * as moment from 'moment';
import 'moment/locale/bg';

moment.locale('bg');
moment.updateLocale('bg', { 
  week: { 
    dow: 1, 
    doy: 4  
  }
});

bootstrapApplication(AppComponent, appConfig) // Ако имаш app.config.ts
  .catch((err) => console.error(err));
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/interceptor/auth.interceptor';
import { ErrorHandlerInterceptor } from './app/interceptor/error-handler.interceptor';
import { withInterceptorsFromDi } from '@angular/common/http';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeBg from '@angular/common/locales/bg';
import { BulgarianMomentDateAdapter } from './app/services/bulgarian-moment-date-adapter';

// Регистриране на българската локализация
registerLocaleData(localeBg);

// Български формат за дати
export const BG_DATE_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};


export const appConfig: ApplicationConfig = {
  providers: [    
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorHandlerInterceptor, multi: true },
    // Глобални настройки за български datepicker
    { provide: MAT_DATE_LOCALE, useValue: 'bg-BG' },
    { 
      provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, 
      useValue: { 
        useUtc: false, 
        strict: true 
      } 
    },
    { provide: MAT_DATE_FORMATS, useValue: BG_DATE_FORMATS },
    { 
      provide: DateAdapter, 
      useClass: BulgarianMomentDateAdapter, 
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] 
    },
    provideRouter(routes)
  ]
};
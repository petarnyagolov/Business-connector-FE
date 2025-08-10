import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../service/notification.service';

export interface ApiError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}

@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.handle401Error(error);
        } else if (error.status >= 400) {
          this.handleOtherErrors(error);
        }
        
        return throwError(() => error);
      })
    );
  }

  private handle401Error(error: HttpErrorResponse): void {
    let errorMessage = 'Сесията ви е изтекла. Моля, влезте отново в системата.';
    
    // Проверяваме дали имаме детайли за грешката от бекенда
    if (error.error && typeof error.error === 'object') {
      const apiError: ApiError = error.error;
      
      switch (apiError.error) {
        case 'TOKEN_EXPIRED':
          errorMessage = 'Токенът ви е изтекъл. Моля, влезте отново в системата.';
          break;
        case 'TOKEN_INVALID':
          errorMessage = 'Невалиден токен. Моля, влезте отново в системата.';
          break;
        case 'TOKEN_MISSING':
          errorMessage = 'Липсва токен за удостоверяване. Моля, влезте в системата.';
          break;
        case 'EMAIL_NOT_VERIFIED':
          errorMessage = 'Email адресът ви не е потвърден. Моля, проверете имейла си за потвърждение.';
          break;
        case 'ACCESS_DENIED':
          errorMessage = 'Нямате права за достъп до този ресурс.';
          break;
        default:
          errorMessage = apiError.message || errorMessage;
      }
    }

    // Показваме съобщението на потребителя
    this.notificationService.error(errorMessage, 'Проблем с удостовереността', 7000);
    
    // Изчистваме данните за удостоверяване
    this.authService.logout();
    
    // Пренасочваме към login страницата след малка пауза
    setTimeout(() => {
      this.router.navigate(['/login'], { 
        queryParams: { 
          returnUrl: this.router.url,
          reason: 'session_expired' 
        }
      });
    }, 2500);
  }

  private handleOtherErrors(error: HttpErrorResponse): void {
    let errorMessage = 'Възникна неочаквана грешка. Моля, опитайте отново.';
    
    // Проверяваме дали имаме детайли за грешката от бекенда
    if (error.error && typeof error.error === 'object') {
      const apiError: ApiError = error.error;
      errorMessage = apiError.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Показваме съобщението според статуса
    switch (error.status) {
      case 400:
        this.notificationService.error('Невалидни данни. ' + errorMessage, 'Грешка в данните');
        break;
      case 403:
        this.notificationService.warning('Нямате права за тази операция. ' + errorMessage, 'Достъп отказан');
        break;
      case 404:
        this.notificationService.warning('Търсеният ресурс не е намерен.', 'Не е намерен');
        break;
      case 409:
        this.notificationService.warning('Конфликт с данните. ' + errorMessage, 'Конфликт');
        break;
      case 422:
        this.notificationService.error('Данните не могат да бъдат обработени. ' + errorMessage, 'Невалидни данни');
        break;
      case 500:
        this.notificationService.error('Вътрешна грешка на сървъра. Моля, опитайте по-късно.', 'Сървърна грешка');
        break;
      case 503:
        this.notificationService.warning('Услугата временно не е достъпна. Моля, опитайте по-късно.', 'Услугата не е достъпна');
        break;
      default:
        this.notificationService.error(errorMessage, 'Грешка');
    }
  }
}

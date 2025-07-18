import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { EmailVerificationDialogComponent } from '../component/email-verification-dialog/email-verification-dialog.component';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmailVerificationDialogService {

  constructor(
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  /**
   * Централизиран метод за проверка на верификация с автоматично показване на диалог
   * Използвай този метод във всички компоненти преди критични действия
   */
  checkEmailVerificationOrShowDialog(): Observable<boolean> {
    // Проверяваме дали потребителят може да изпълни действието
    if (this.authService.canPerformAction()) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    // Ако не е верифициран, показваме диалог
    const userEmail = this.authService.getUserEmail();
    if (!userEmail) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return this.openVerificationDialog(userEmail);
  }

  /**
   * Отваря диалог за верификация (използва се вътрешно)
   */
  private openVerificationDialog(email: string): Observable<boolean> {
    const dialogRef = this.dialog.open(EmailVerificationDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { email }
    });

    return dialogRef.afterClosed();
  }
}

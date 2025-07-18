import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { EmailVerificationModalComponent } from '../component/email-verification-modal/email-verification-modal.component';

@Injectable({
  providedIn: 'root'
})
export class EmailVerificationService {

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  checkVerificationOrPrompt(): Observable<boolean> {
    return new Observable(observer => {
      if (this.authService.canPerformAction()) {
        observer.next(true);
        observer.complete();
        return;
      }

      if (!this.authService.isAuthenticated()) {
        observer.next(false);
        observer.complete();
        return;
      }

      const userEmail = this.authService.getUserEmail();
      if (!userEmail) {
        observer.next(false);
        observer.complete();
        return;
      }

      this.openVerificationModal(userEmail).subscribe(result => {
        observer.next(result === true);
        observer.complete();
      });
    });
  }

  isEmailVerified(): boolean {
    return this.authService.isEmailVerified();
  }

  canPerformAction(): boolean {
    return this.authService.canPerformAction();
  }

  resendVerificationLink(email: string): Observable<any> {
    return this.authService.resendVerificationLink(email);
  }

  verifyEmailWithToken(token: string): Observable<any> {
    return this.authService.verifyEmailWithToken(token);
  }

  private openVerificationModal(email: string): Observable<boolean> {
    const dialogRef = this.dialog.open(EmailVerificationModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true, // Не позволяваме затваряне без действие
      data: { 
        email,
        title: 'Верификация на имейл'
      }
    });

    return dialogRef.afterClosed();
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { EmailVerificationService } from '../../service/email-verification.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [
    CommonModule, 
    MatProgressSpinnerModule, 
    MatCardModule, 
    MatButtonModule, 
    MatTabsModule,
    MatIconModule,
    MatExpansionModule,
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule
  ],
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss']
})
export class EmailVerificationComponent implements OnInit {
  isLoading = true;
  isVerified = false;
  errorMessage: string | null = null;
  token: string | null = null;
  resendEmail: string = '';
  resendMessage: string | null = null;
  isResending = false;
  
  // Нови properties за ръчна верификация
  manualToken: string = '';
  isVerifyingManual = false;
  manualVerificationMessage: string | null = null;
  manualVerificationSuccess = false;
  
  // Properties за табовете и UI
  selectedTabIndex = 0;
  showDebugInfo = true; // За development - може да се изключи за production
  
  // Нови properties за автоматично обновяване на токена
  isRefreshingToken = false;
  tokenRefreshMessage: string | null = null;
  
  // Properties за връщане към предишната страница
  returnUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    public authService: AuthService, // Променено от private на public
    private emailVerificationService: EmailVerificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('t');
    
    const savedEmail = localStorage.getItem('verification_email');
    if (savedEmail) {
      this.resendEmail = savedEmail;
      localStorage.removeItem('verification_email');
    } else {
      this.resendEmail = this.authService.getUserEmail() || '';
    }
    
    // Ако има токен в URL, показваме автоматичния таб
    if (this.token) {
      this.selectedTabIndex = 0; // Автоматична верификация
      this.emailVerificationService.verifyEmailWithToken(this.token).subscribe({
        next: (response: HttpResponse<any>) => {
          this.isLoading = false;
          if (response.status === 202 || response.status === 200) {
            this.isVerified = true;
            
            // Автоматично обновяваме токена след верификация
            this.handleSuccessfulVerification('Вашият имейл беше успешно верифициран!');
          } else {
            this.isVerified = false;
            this.errorMessage = 'Верификацията неуспешна. Статус: ' + response.status;
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.isVerified = false;
          if (error.error && typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.status === 400) {
            this.errorMessage = 'Невалиден или изтекъл линк за верификация.';
          } else {
            this.errorMessage = 'Възникна неочаквана грешка. Моля опитайте отново.';
          }
          console.error('Email verification error:', error);
        }
      });
    } else {
      // Ако няма токен в URL, показваме ръчния таб по подразбиране
      this.selectedTabIndex = 1; // Ръчна верификация
      this.isLoading = false;
    }
  }

  verifyManualToken(): void {
    if (!this.manualToken.trim()) {
      this.manualVerificationMessage = 'Моля въведете валиден токен';
      this.manualVerificationSuccess = false;
      return;
    }

    this.isVerifyingManual = true;
    this.manualVerificationMessage = null;

    this.emailVerificationService.verifyEmailWithToken(this.manualToken.trim()).subscribe({
      next: (response: HttpResponse<any>) => {
        this.isVerifyingManual = false;
        if (response.status === 202 || response.status === 200) {
          this.isVerified = true;
          this.manualVerificationSuccess = true;
          
          // Автоматично обновяваме токена след ръчна верификация
          this.handleSuccessfulVerification('Успешна верификация! Вашият имейл е потвърден.');
        } else {
          this.manualVerificationSuccess = false;
          this.manualVerificationMessage = 'Верификацията неуспешна. Статус: ' + response.status;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isVerifyingManual = false;
        this.manualVerificationSuccess = false;
        if (error.error && typeof error.error === 'string') {
          this.manualVerificationMessage = error.error;
        } else if (error.status === 400) {
          this.manualVerificationMessage = 'Невалиден или изтекъл токен за верификация.';
        } else {
          this.manualVerificationMessage = 'Възникна неочаквана грешка. Моля опитайте отново.';
        }
        console.error('Manual email verification error:', error);
      }
    });
  }

  resendVerificationLink() {
    if (!this.resendEmail) {
      this.resendMessage = 'Моля, въведете email.';
      return;
    }
    this.isResending = true;
    this.resendMessage = null;
    this.emailVerificationService.resendVerificationLink(this.resendEmail).subscribe({
      next: () => {
        this.isResending = false;
        this.resendMessage = 'Линкът беше изпратен успешно!';
      },
      error: (err) => {
        this.isResending = false;
        this.resendMessage = 'Възникна грешка при изпращане на линка.';
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToCompanies(): void {
    this.router.navigate(['/companies']);
  }

  get shouldShowLoginButton(): boolean {
    return this.isVerified && !this.authService.isAuthenticated();
  }

  get shouldShowCompaniesButton(): boolean {
    return this.isVerified && this.authService.isAuthenticated();
  }

  goBack(): void {
    // Опитваме се да се върнем към предишната страница
    window.history.back();
  }

  // Централизиран метод за обработка на успешна верификация
  private handleSuccessfulVerification(initialMessage: string): void {
    // Ако потребителят е влязъл, автоматично обновяваме токена
    if (this.authService.isAuthenticated()) {
      this.isRefreshingToken = true;
      this.tokenRefreshMessage = 'Обновявам токена...';
      
      console.log('Starting automatic token refresh after verification...');
      this.authService.forceRefreshToken().subscribe({
        next: () => {
          this.isRefreshingToken = false;
          this.tokenRefreshMessage = '✅ Токенът беше обновен автоматично. Всичко е наред!';
          console.log('Token refreshed successfully after verification');
          
          // Показваме съобщението за успех
          if (this.selectedTabIndex === 1) {
            // За ръчна верификация
            this.manualVerificationMessage = initialMessage + ' ' + this.tokenRefreshMessage;
          }
        },
        error: (err) => {
          this.isRefreshingToken = false;
          this.tokenRefreshMessage = '⚠️ Грешка при обновяване на токена. Моля опитайте отново.';
          console.error('Failed to refresh token after verification:', err);
          
          // Показваме съобщението за грешка
          if (this.selectedTabIndex === 1) {
            // За ръчна верификация
            this.manualVerificationMessage = initialMessage + ' ' + this.tokenRefreshMessage;
          }
        }
      });
    } else {
      // Ако не е влязъл, просто показваме съобщението
      this.tokenRefreshMessage = '✅ ' + initialMessage;
      if (this.selectedTabIndex === 1) {
        this.manualVerificationMessage = this.tokenRefreshMessage;
      }
    }
  }
}

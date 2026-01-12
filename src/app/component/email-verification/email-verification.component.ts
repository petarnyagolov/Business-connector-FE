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
  
  manualToken: string = '';
  isVerifyingManual = false;
  manualVerificationMessage: string | null = null;
  manualVerificationSuccess = false;
  
  selectedTabIndex = 0;
  showDebugInfo = true; 
  
  isRefreshingToken = false;
  tokenRefreshMessage: string | null = null;
  
  returnUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    public authService: AuthService, 
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
    
    if (this.token) {
      this.selectedTabIndex = 0; 
      this.emailVerificationService.verifyEmailWithToken(this.token).subscribe({
        next: (response: HttpResponse<any>) => {
          this.isLoading = false;
          if (response.status === 202 || response.status === 200) {
            this.isVerified = true;
            
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
      this.selectedTabIndex = 1; 
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
    window.history.back();
  }

  private handleSuccessfulVerification(initialMessage: string): void {
    if (this.authService.isAuthenticated()) {
      this.isRefreshingToken = true;
      this.tokenRefreshMessage = 'Обновявам токена...';
      
      console.log('Starting automatic token refresh after verification...');
      this.authService.refreshToken().subscribe({
        next: () => {
          this.isRefreshingToken = false;
          this.tokenRefreshMessage = '✅ Токенът беше обновен автоматично. Всичко е наред!';
          console.log('Token refreshed successfully after verification');
          
          if (this.selectedTabIndex === 1) {
            this.manualVerificationMessage = initialMessage + ' ' + this.tokenRefreshMessage;
          }
        },
        error: (err: any) => {
          this.isRefreshingToken = false;
          this.tokenRefreshMessage = '⚠️ Грешка при обновяване на токена. Моля опитайте отново.';
          console.error('Failed to refresh token after verification:', err);
          
          if (this.selectedTabIndex === 1) {
            this.manualVerificationMessage = initialMessage + ' ' + this.tokenRefreshMessage;
          }
        }
      });
    } else {
      this.tokenRefreshMessage = '✅ ' + initialMessage;
      if (this.selectedTabIndex === 1) {
        this.manualVerificationMessage = this.tokenRefreshMessage;
      }
    }
  }
}

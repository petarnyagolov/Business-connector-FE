import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule, MatButtonModule, FormsModule, MatFormFieldModule, MatInputModule],
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

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('t');
    if (this.token) {
      this.authService.verifyEmailWithToken(this.token).subscribe({
        next: (response: HttpResponse<any>) => {
          this.isLoading = false;
          if (response.status === 202) {
            this.isVerified = true;
            setTimeout(() => this.router.navigate(['/login']), 2000);
          } else {
            this.isVerified = false;
            this.errorMessage = 'Verification failed. Status: ' + response.status;
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.isVerified = false;
          if (error.error && typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.status === 400) {
            this.errorMessage = 'Invalid or expired verification link.';
          } else {
            this.errorMessage = 'An unexpected error occurred. Please try again.';
          }
          console.error('Email verification error:', error);
        }
      });
    } else {
      this.isLoading = false;
      this.errorMessage = 'Verification token is missing from the link.';
    }
  }

  resendVerificationLink() {
    if (!this.resendEmail) {
      this.resendMessage = 'Моля, въведете email.';
      return;
    }
    this.isResending = true;
    this.resendMessage = null;
    // Изпраща заявка към /api/verify/email/resend-verification
    this.authService.resendVerificationLink(this.resendEmail).subscribe({
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
}

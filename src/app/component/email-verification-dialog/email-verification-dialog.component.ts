import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { EmailVerificationService } from '../../service/email-verification.service';

@Component({
  selector: 'app-email-verification-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div mat-dialog-content class="verification-dialog">
      <div class="dialog-header">
        <mat-icon color="warn" class="email-icon">email</mat-icon>
        <h2>Верификация на имейл</h2>
      </div>
      
      <p class="message">
        За да продължите с тази функционалност, моля верифицирайте вашия имейл адрес.
      </p>
      
      <div class="email-info">
        <strong>Имейл:</strong> {{data.email}}
      </div>

      @if (!isLoading && !isSuccess) {
        <div class="actions">
          <p class="resend-info">Ще изпратим нов линк за верификация на вашия имейл.</p>
        </div>
      }

      @if (isLoading) {
        <div class="loading">
          <mat-spinner diameter="30"></mat-spinner>
          <p>Изпращаме линк за верификация...</p>
        </div>
      }

      @if (isSuccess) {
        <div class="success">
          <mat-icon color="primary">check_circle</mat-icon>
          <p>Линкът за верификация е изпратен успешно!</p>
          <p class="check-email">Моля проверете вашия имейл и кликнете върху линка.</p>
        </div>
      }

      @if (hasError) {
        <div class="error">
          <mat-icon color="warn">error</mat-icon>
          <p>Възникна грешка при изпращането. Моля опитайте отново.</p>
        </div>
      }
    </div>

    <div mat-dialog-actions class="dialog-actions">
      <button 
        mat-button 
        (click)="onCancel()"
        [disabled]="isLoading">
        Отказ
      </button>
      
      <button 
        mat-raised-button 
        color="primary"
        (click)="resendVerification()"
        [disabled]="isLoading || isSuccess">
        {{isSuccess ? 'Изпратено' : 'Изпрати линк'}}
      </button>
    </div>
  `,
  styles: [`
    .verification-dialog {
      text-align: center;
      padding: 20px;
      min-width: 350px;
    }

    .dialog-header {
      margin-bottom: 20px;
    }

    .email-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 10px;
    }

    .message {
      margin-bottom: 15px;
      color: #666;
    }

    .email-info {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      margin: 15px 0;
      word-break: break-all;
    }

    .resend-info {
      font-size: 14px;
      color: #777;
      margin: 10px 0;
    }

    .loading, .success, .error {
      margin: 20px 0;
    }

    .loading mat-spinner {
      margin: 0 auto 10px;
    }

    .success mat-icon, .error mat-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      margin-bottom: 10px;
    }

    .check-email {
      font-size: 14px;
      color: #666;
    }

    .dialog-actions {
      justify-content: space-between;
      padding: 16px 24px;
    }
  `]
})
export class EmailVerificationDialogComponent implements OnInit {
  isLoading = false;
  isSuccess = false;
  hasError = false;

  constructor(
    public dialogRef: MatDialogRef<EmailVerificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { email: string },
    private emailVerificationService: EmailVerificationService
  ) {}

  ngOnInit(): void {}

  resendVerification(): void {
    this.isLoading = true;
    this.hasError = false;

    this.emailVerificationService.resendVerificationLink(this.data.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;
      },
      error: (error) => {
        this.isLoading = false;
        this.hasError = true;
        console.error('Error resending verification:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

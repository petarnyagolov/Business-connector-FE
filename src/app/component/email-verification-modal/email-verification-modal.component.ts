import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { EmailVerificationService } from '../../service/email-verification.service';
import { AuthService } from '../../service/auth.service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

export interface EmailVerificationModalData {
  email: string;
  title?: string;
}

@Component({
  selector: 'app-email-verification-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCardModule
  ],
  template: `
    <div class="verification-modal">
      <h2 mat-dialog-title>
        <mat-icon>email</mat-icon>
        {{ data.title || 'Верификация на имейл' }}
      </h2>
      
      <mat-dialog-content>
        <div class="content-container">
          <p class="email-info">
            <strong>Имейл:</strong> {{ data.email }}
          </p>
          <p class="verification-explanation">
            За да продължите с това действие, моля верифицирайте вашия имейл адрес.
          </p>
          
          <!-- Табове за верификация -->
          <mat-tab-group [(selectedIndex)]="selectedTabIndex" class="verification-tabs">
            
            <!-- Таб 1: Изпращане на нов линк -->
            <mat-tab label="📧 Изпрати нов линк">
              <div class="tab-content">
                <div class="info-section">
                  <mat-icon class="info-icon">info</mat-icon>
                  <p>Ще изпратим линк за верификация на вашия имейл. Кликнете върху него или копирайте токена от него.</p>
                </div>
                
                <button mat-raised-button 
                        color="primary" 
                        (click)="resendVerificationLink()" 
                        [disabled]="isResending"
                        class="resend-button">
                  @if (isResending) {
                    <mat-spinner diameter="20"></mat-spinner>
                  }
                  @if (!isResending) {
                    <mat-icon>send</mat-icon>
                  }
                  {{ isResending ? 'Изпращаме...' : 'Изпрати линк' }}
                </button>
                
                @if (resendMessage) {
                  <div class="result-message" 
                       [ngClass]="{'success': resendMessage.includes('успешно'), 'error': !resendMessage.includes('успешно')}">
                    <mat-icon>{{ resendMessage.includes('успешно') ? 'check_circle' : 'error' }}</mat-icon>
                    <span>{{ resendMessage }}</span>
                  </div>
                }
              </div>
            </mat-tab>
            
            <!-- Таб 2: Ръчна верификация -->
            <mat-tab label="🔑 Въведи токен">
              <div class="tab-content">
                <div class="info-section">
                  <mat-icon class="info-icon">info</mat-icon>
                  <p>Ако имате токен от имейла, въведете го тук за директна верификация.</p>
                </div>
                
                <mat-form-field appearance="outline" class="token-field">
                  <mat-label>Токен за верификация</mat-label>
                  <input matInput 
                         [(ngModel)]="manualToken" 
                         placeholder="Въведете токена от имейла"
                         [disabled]="isVerifyingManual || isRefreshingToken">
                  <mat-icon matSuffix>vpn_key</mat-icon>
                </mat-form-field>
                
                <button mat-raised-button 
                        color="primary" 
                        (click)="verifyManualToken()" 
                        [disabled]="!manualToken || isVerifyingManual || isRefreshingToken"
                        class="verify-button">
                  @if (isVerifyingManual || isRefreshingToken) {
                    <mat-spinner diameter="20"></mat-spinner>
                  }
                  @if (!isVerifyingManual && !isRefreshingToken) {
                    <mat-icon>verified_user</mat-icon>
                  }
                  {{ getVerifyButtonText() }}
                </button>
                
                @if (manualVerificationMessage) {
                  <div class="result-message"
                       [ngClass]="{'success': manualVerificationSuccess, 'error': !manualVerificationSuccess}">
                    <mat-icon>{{ manualVerificationSuccess ? 'check_circle' : 'error' }}</mat-icon>
                    <span>{{ manualVerificationMessage }}</span>
                  </div>
                }
              </div>
            </mat-tab>
            
          </mat-tab-group>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="closeModal()" [disabled]="isVerifyingManual || isRefreshingToken">
          {{ (manualVerificationSuccess || resendMessage?.includes('успешно')) ? 'Готово' : 'Отказ' }}
        </button>
        @if (manualVerificationSuccess) {
          <button 
            mat-raised-button 
            color="primary" 
            (click)="continueWithAction()"
            [disabled]="isRefreshingToken">
            <mat-icon>arrow_forward</mat-icon>
            Продължи
          </button>
        }
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .verification-modal {
      width: 100%;
      max-width: 600px;
    }
    
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
      margin-bottom: 0;
    }
    
    .content-container {
      padding: 16px 0;
    }
    
    .email-info {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      border-left: 4px solid #1976d2;
    }
    
    .verification-explanation {
      color: #666;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    
    .verification-tabs {
      min-height: 300px;
    }
    
    .tab-content {
      padding: 24px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .info-section {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #e3f2fd;
      padding: 16px;
      border-radius: 8px;
      width: 100%;
      
      .info-icon {
        color: #1976d2;
        margin-top: 2px;
      }
      
      p {
        margin: 0;
        color: #1565c0;
        line-height: 1.4;
      }
    }
    
    .token-field {
      width: 100%;
      max-width: 400px;
    }
    
    .resend-button, .verify-button {
      min-width: 160px;
      height: 48px;
      font-size: 16px;
      
      mat-spinner {
        margin-right: 8px;
      }
      
      mat-icon {
        margin-right: 8px;
      }
    }
    
    .result-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      width: 100%;
      max-width: 400px;
      
      &.success {
        background: #e8f5e8;
        color: #2e7d32;
        border: 1px solid #4caf50;
      }
      
      &.error {
        background: #ffebee;
        color: #d32f2f;
        border: 1px solid #f44336;
      }
      
      mat-icon {
        font-size: 20px;
      }
      
      span {
        flex: 1;
        line-height: 1.4;
      }
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
      gap: 8px;
    }
  `]
})
export class EmailVerificationModalComponent implements OnInit {
  selectedTabIndex = 0;
  
  // Resend properties
  isResending = false;
  resendMessage: string | null = null;
  
  // Manual verification properties
  manualToken = '';
  isVerifyingManual = false;
  isRefreshingToken = false;
  manualVerificationMessage: string | null = null;
  manualVerificationSuccess = false;

  constructor(
    public dialogRef: MatDialogRef<EmailVerificationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmailVerificationModalData,
    private emailVerificationService: EmailVerificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Ако е първо отваряне, показваме таба за изпращане на линк
    this.selectedTabIndex = 0;
  }

  resendVerificationLink(): void {
    this.isResending = true;
    this.resendMessage = null;
    
    this.emailVerificationService.resendVerificationLink(this.data.email).subscribe({
      next: () => {
        this.isResending = false;
        this.resendMessage = '✅ Линкът беше изпратен успешно! Проверете вашия имейл.';
      },
      error: (err) => {
        this.isResending = false;
        this.resendMessage = '❌ Възникна грешка при изпращане на линка. Моля опитайте отново.';
        console.error('Resend verification error:', err);
      }
    });
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
          this.manualVerificationSuccess = true;
          this.handleSuccessfulVerification();
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
        console.error('Manual verification error:', error);
      }
    });
  }

  private handleSuccessfulVerification(): void {
    // Автоматично обновяваме токена
    if (this.authService.isAuthenticated()) {
      this.isRefreshingToken = true;
      this.manualVerificationMessage = 'Обновявам токена...';
      
      this.authService.refreshToken().subscribe({
        next: () => {
          this.isRefreshingToken = false;
          this.manualVerificationMessage = '✅ Имейлът е верифициран успешно! Токенът беше обновен автоматично.';
        },
        error: (err: any) => {
          this.isRefreshingToken = false;
          this.manualVerificationMessage = '✅ Имейлът е верифициран, но възникна грешка при обновяване на токена.';
          console.error('Token refresh error:', err);
        }
      });
    } else {
      this.manualVerificationMessage = '✅ Имейлът е верифициран успешно!';
    }
  }

  getVerifyButtonText(): string {
    if (this.isVerifyingManual) return 'Верифицираме...';
    if (this.isRefreshingToken) return 'Обновяваме токена...';
    return 'Верифицирай сега';
  }

  continueWithAction(): void {
    // Затваряме модала и връщаме true (успешна верификация)
    this.dialogRef.close(true);
  }

  closeModal(): void {
    // Ако верификацията е успешна, връщаме true, иначе false
    this.dialogRef.close(this.manualVerificationSuccess);
  }
}

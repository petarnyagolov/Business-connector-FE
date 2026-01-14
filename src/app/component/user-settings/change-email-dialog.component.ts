import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-change-email-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Смяна на имейл</h2>
    <mat-dialog-content>
      <p style="color: #666; margin-bottom: 20px;">
        Текущ имейл: <strong>{{ data.currentEmail }}</strong>
      </p>
      
      <form [formGroup]="emailForm">
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Нов имейл</mat-label>
          <input matInput type="email" formControlName="newEmail">
          <mat-error *ngIf="emailForm.get('newEmail')?.hasError('required')">
            Въведете нов имейл адрес
          </mat-error>
          <mat-error *ngIf="emailForm.get('newEmail')?.hasError('email')">
            Невалиден имейл адрес
          </mat-error>
        </mat-form-field>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="success-message">
          {{ successMessage }}
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Отказ</button>
      <button mat-raised-button color="accent" (click)="onSubmit()" [disabled]="!emailForm.valid || loading">
        {{ loading ? 'Изпращане...' : 'Изпрати потвърждение' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .error-message {
      color: #f44336;
      margin-top: 16px;
      font-size: 14px;
    }
    .success-message {
      color: #4caf50;
      margin-top: 16px;
      font-size: 14px;
    }
  `]
})
export class ChangeEmailDialogComponent {
  emailForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ChangeEmailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentEmail: string }
  ) {
    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.emailForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const { newEmail } = this.emailForm.value;
      
      this.authService.changeEmail(newEmail).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Имейл за потвърждение е изпратен на новия адрес!', 'Затвори', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          setTimeout(() => {
            this.dialogRef.close(true);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Грешка при смяна на имейла';
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../service/auth.service';
import { PasswordValidators } from '../../validators/password.validators';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Смяна на парола</h2>
    <mat-dialog-content>
      <form [formGroup]="passwordForm">
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Текуща парола</mat-label>
          <input matInput [type]="hideOld ? 'password' : 'text'" formControlName="oldPassword">
          <button mat-icon-button matSuffix (click)="hideOld = !hideOld" type="button">
            <mat-icon>{{hideOld ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-error *ngIf="passwordForm.get('oldPassword')?.hasError('required')">
            Въведете текущата си парола
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%; margin-top: 16px;">
          <mat-label>Нова парола</mat-label>
          <input matInput [type]="hideNew ? 'password' : 'text'" formControlName="password">
          <button mat-icon-button matSuffix (click)="hideNew = !hideNew" type="button">
            <mat-icon>{{hideNew ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-error *ngIf="passwordForm.get('password')?.hasError('required')">
            Въведете нова парола
          </mat-error>
          <mat-error *ngIf="passwordForm.get('password')?.hasError('minlength')">
            Паролата трябва да е минимум 8 символа
          </mat-error>
          <mat-error *ngIf="passwordForm.get('password')?.hasError('hasUpperCase')">
            Паролата трябва да съдържа главна буква
          </mat-error>
          <mat-error *ngIf="passwordForm.get('password')?.hasError('hasLowerCase')">
            Паролата трябва да съдържа малка буква
          </mat-error>
          <mat-error *ngIf="passwordForm.get('password')?.hasError('hasNumeric')">
            Паролата трябва да съдържа цифра
          </mat-error>
          <mat-error *ngIf="passwordForm.get('password')?.hasError('hasSpecial')">
            Паролата трябва да съдържа специален символ
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%; margin-top: 16px;">
          <mat-label>Потвърди нова парола</mat-label>
          <input matInput [type]="hideConfirm ? 'password' : 'text'" formControlName="confirmPassword">
          <button mat-icon-button matSuffix (click)="hideConfirm = !hideConfirm" type="button">
            <mat-icon>{{hideConfirm ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('required')">
            Потвърдете новата парола
          </mat-error>
          <mat-error *ngIf="passwordForm.hasError('passwordMismatch') && !passwordForm.get('confirmPassword')?.hasError('required')">
            Паролите не съвпадат
          </mat-error>
        </mat-form-field>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Отказ</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!passwordForm.valid || loading">
        {{ loading ? 'Запазване...' : 'Запази' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .error-message {
      color: #f44336;
      margin-top: 16px;
      font-size: 14px;
    }
  `]
})
export class ChangePasswordDialogComponent {
  passwordForm: FormGroup;
  hideOld = true;
  hideNew = true;
  hideConfirm = true;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        PasswordValidators.passwordStrength
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: PasswordValidators.passwordMatch
    });
  }

  onSubmit(): void {
    if (this.passwordForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      
      const { oldPassword, password, confirmPassword } = this.passwordForm.value;
      
      this.authService.changePassword(oldPassword, password, confirmPassword).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Паролата е сменена успешно!', 'Затвори', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Грешка при смяна на паролата';
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

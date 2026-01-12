import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { PasswordValidators } from '../../validators/password.validators';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  token: string | null = null;
  hidePassword = true;
  hideConfirmPassword = true;
  tokenInvalid = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        PasswordValidators.passwordStrength
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: PasswordValidators.passwordMatch });
  }

  ngOnInit(): void {
    // Get token from URL query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.tokenInvalid = true;
        this.snackBar.open(
          'Невалиден или липсващ токен за възстановяване.',
          'Затвори',
          { duration: 5000 }
        );
      }
    });
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.token) {
      return;
    }

    this.isLoading = true;
    const password = this.resetPasswordForm.value.password;

    this.authService.resetPassword(this.token, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.snackBar.open(
          'Паролата е променена успешно! Можете да влезете с новата парола.',
          'Затвори',
          { duration: 5000 }
        );
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'Невалиден или изтекъл токен. Моля, заявете нов линк за възстановяване.';
        this.snackBar.open(errorMessage, 'Затвори', { duration: 5000 });
      }
    });
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Helper methods for password validation errors
  get passwordControl() {
    return this.resetPasswordForm.get('password');
  }

  get confirmPasswordControl() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  hasPasswordError(errorType: string): boolean {
    return this.passwordControl?.hasError(errorType) && this.passwordControl?.touched || false;
  }
}

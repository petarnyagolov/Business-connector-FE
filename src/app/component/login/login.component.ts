import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { NotificationService } from '../../service/notification.service';
import { tap } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  styleUrls: ['./login.component.scss'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule, MatIconModule, MatButtonModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  
    constructor(
      private fb: FormBuilder, 
      private authService: AuthService, 
      private router: Router,
      private notificationService: NotificationService
    ) {
      this.loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
      });
    }

    onSubmit(): void {
      if (this.loginForm.valid) {
        const loginForm = this.loginForm.value;
         this.authService.login({ email: loginForm.email, password: loginForm.password }).pipe(
                      tap({
                        next: (loginResponse: any) => {
                          console.log('Login Response:', loginResponse); 
                          this.notificationService.success('Успешно влизане!');
                        },
                        error: (loginError: any) => {
                          console.error('Login Error:', loginError);
                          this.notificationService.error('Неуспешно влизане. Моля, опитайте отново.');
                        }
                      })
                    ).subscribe();
                  
      } else {
        console.log('Form is invalid.');
      }
    }
  }
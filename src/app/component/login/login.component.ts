import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { tap } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  styleUrls: ['./login.component.scss'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  
    constructor(
      private fb: FormBuilder, 
      private authService: AuthService, 
      private router: Router
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
                          alert('Login successful!');
                        },
                        error: (loginError: any) => {
                          console.error('Login Error:', loginError); // Handle the login error
                          alert('Login failed. Please try again.');
                        }
                      })
                    ).subscribe();
                  
      } else {
        console.log('Form is invalid.');
      }
    }
  }
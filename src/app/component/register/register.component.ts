import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { AuthService } from '../../service/auth.service';
import { tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';

@Component({
  standalone: true,
  selector: 'app-registration-form',
  imports: [ReactiveFormsModule, CommonModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registrationForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registrationForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const formData = this.registrationForm.value;
      this.authService.register(formData).pipe(
        tap({
          next: (response: any) => {
            console.log('Response:', response); 
            alert('Registration successful!');
            this.authService.login({ email: formData.email, password: formData.password }).pipe(
              tap({
                next: (loginResponse: any) => {
                  console.log('Login Response:', loginResponse); 
                  alert('Login successful!');
                  },
                error: (loginError: any) => {
                  console.error('Login Error:', loginError);
                  alert('Login failed. Please try again.');
                }
              })
            ).subscribe();
          },
          error: (error: any) => {
            console.error('Error:', error);
            alert('Registration failed. Please try again.');
          }
        })
      ).subscribe();
    } else {
      console.log('Form is invalid.');
    }
  }
}
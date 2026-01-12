import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../service/auth.service';
import { of, throwError } from 'rxjs';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['forgotPassword']);

    await TestBed.configureTestingModule({
      imports: [
        ForgotPasswordComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when email is empty', () => {
    expect(component.forgotPasswordForm.valid).toBeFalsy();
  });

  it('should have invalid form when email is invalid', () => {
    component.forgotPasswordForm.controls['email'].setValue('invalid-email');
    expect(component.forgotPasswordForm.valid).toBeFalsy();
  });

  it('should have valid form when email is valid', () => {
    component.forgotPasswordForm.controls['email'].setValue('test@example.com');
    expect(component.forgotPasswordForm.valid).toBeTruthy();
  });

  it('should call authService.forgotPassword on submit', () => {
    authService.forgotPassword.and.returnValue(of({ message: 'Success' }));
    component.forgotPasswordForm.controls['email'].setValue('test@example.com');
    
    component.onSubmit();
    
    expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
    expect(component.emailSent).toBeTruthy();
  });

  it('should handle error on submit', () => {
    authService.forgotPassword.and.returnValue(throwError(() => new Error('Error')));
    component.forgotPasswordForm.controls['email'].setValue('test@example.com');
    
    component.onSubmit();
    
    expect(authService.forgotPassword).toHaveBeenCalled();
    expect(component.emailSent).toBeFalsy();
  });
});

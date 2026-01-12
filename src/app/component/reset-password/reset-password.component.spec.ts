import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../service/auth.service';
import { of, throwError } from 'rxjs';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['resetPassword']);

    await TestBed.configureTestingModule({
      imports: [
        ResetPasswordComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ token: 'test-token-123' })
          }
        }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract token from query params', () => {
    expect(component.token).toBe('test-token-123');
  });

  it('should have invalid form when passwords are empty', () => {
    expect(component.resetPasswordForm.valid).toBeFalsy();
  });

  it('should have invalid form when password is too short', () => {
    component.resetPasswordForm.controls['password'].setValue('Short1!');
    component.resetPasswordForm.controls['confirmPassword'].setValue('Short1!');
    expect(component.resetPasswordForm.valid).toBeFalsy();
  });

  it('should have invalid form when passwords do not match', () => {
    component.resetPasswordForm.controls['password'].setValue('ValidPass123!');
    component.resetPasswordForm.controls['confirmPassword'].setValue('DifferentPass123!');
    expect(component.resetPasswordForm.controls['confirmPassword'].hasError('passwordMismatch')).toBeTruthy();
  });

  it('should have valid form with strong matching passwords', () => {
    component.resetPasswordForm.controls['password'].setValue('ValidPass123!');
    component.resetPasswordForm.controls['confirmPassword'].setValue('ValidPass123!');
    expect(component.resetPasswordForm.valid).toBeTruthy();
  });

  it('should call authService.resetPassword on submit', () => {
    authService.resetPassword.and.returnValue(of({ message: 'Success' }));
    component.resetPasswordForm.controls['password'].setValue('ValidPass123!');
    component.resetPasswordForm.controls['confirmPassword'].setValue('ValidPass123!');
    
    component.onSubmit();
    
    expect(authService.resetPassword).toHaveBeenCalledWith('test-token-123', 'ValidPass123!');
  });

  it('should handle error on submit', () => {
    authService.resetPassword.and.returnValue(throwError(() => new Error('Invalid token')));
    component.resetPasswordForm.controls['password'].setValue('ValidPass123!');
    component.resetPasswordForm.controls['confirmPassword'].setValue('ValidPass123!');
    
    component.onSubmit();
    
    expect(authService.resetPassword).toHaveBeenCalled();
  });
});

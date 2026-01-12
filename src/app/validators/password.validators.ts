import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Shared password validators used across registration and password reset
 */
export class PasswordValidators {
  
  /**
   * Validates password strength requirements:
   * - At least one lowercase letter
   * - At least one uppercase letter
   * - At least one digit
   * - At least one special character
   */
  static passwordStrength(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value || '';
    
    if (!value) return null;

    // Use Unicode property escapes to support Cyrillic and other scripts (matches backend logic)
    const hasLowerCase = /\p{Ll}/u.test(value);
    const hasUpperCase = /\p{Lu}/u.test(value);
    const hasNumeric = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(value);
    
    const errors: ValidationErrors = {};
    
    if (!hasLowerCase) errors['hasLowerCase'] = true;
    if (!hasUpperCase) errors['hasUpperCase'] = true;
    if (!hasNumeric) errors['hasNumeric'] = true;
    if (!hasSpecial) errors['hasSpecial'] = true;

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Validates that password and confirmPassword fields match
   * Usage: Add to FormGroup validators: { validators: PasswordValidators.passwordMatch }
   */
  static passwordMatch(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPasswordControl = form.get('confirmPassword');
    
    if (!confirmPasswordControl) return null;

    const confirmPassword = confirmPasswordControl.value;

    // If confirm password is empty, let 'required' validator handle it
    if (!confirmPassword) {
      return null;
    }

    // If passwords don't match, set error on confirmPassword control
    if (password !== confirmPassword) {
      confirmPasswordControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Clear password mismatch error if they match (but preserve other errors)
      const errors = confirmPasswordControl.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPasswordControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return null;
    }
  }
}

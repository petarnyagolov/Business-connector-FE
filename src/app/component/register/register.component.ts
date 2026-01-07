import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core'; // Import AfterViewInit
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { AuthService } from '../../service/auth.service';
import { tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { CompanyFormComponent } from '../company-form/company-form.component';
import { CompanyService } from '../../service/company.service';
import { IndustryService } from '../../service/industry.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CompanyValidationService } from '../../service/company-validation.service';
import { environment } from '../../../environments/environment';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { SearchCountryField, CountryISO } from 'ngx-intl-tel-input';


@Component({
  standalone: true,
  selector: 'app-registration-form',
  imports: [ReactiveFormsModule, CommonModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatDividerModule, MatOptionModule, MatSelectModule, CompanyFormComponent, MatSnackBarModule, NgxIntlTelInputModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, AfterViewInit {
  // Phone input configuration
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  preferredCountries: CountryISO[] = [CountryISO.Bulgaria, CountryISO.Romania, CountryISO.Greece]; 
  registrationForm: FormGroup;
  companyFormData: any = null;
  selectedCompanyLogo: File | null = null; 
  @ViewChild('companyFormComponent') companyFormComponentRef!: CompanyFormComponent;

  ngAfterViewInit(): void {
    // Auto-scroll to highlighted country in dropdown with continuous polling
    setTimeout(() => {
      let scrollInterval: any = null;
      
      // Start polling when search input is focused
      document.addEventListener('focusin', (e) => {
        const target = e.target as HTMLElement;
        if (target && target.classList.contains('iti__search-input')) {
          // Clear any existing interval
          if (scrollInterval) clearInterval(scrollInterval);
          
          // Poll every 50ms while search is active
          scrollInterval = setInterval(() => {
            const highlighted = document.querySelector('.iti__country.iti__highlight') as HTMLElement;
            const container = document.querySelector('.iti__country-list') as HTMLElement;
            
            if (highlighted && container) {
              const highlightedTop = highlighted.offsetTop;
              const containerScroll = container.scrollTop;
              const searchBarHeight = 60;
              
              // Only scroll if highlighted is not visible at top
              if (Math.abs(containerScroll - (highlightedTop - searchBarHeight)) > 5) {
                container.scrollTop = highlightedTop - searchBarHeight;
              }
            }
          }, 50);
        }
      }, true);
      
      // Stop polling when search loses focus
      document.addEventListener('focusout', (e) => {
        const target = e.target as HTMLElement;
        if (target && target.classList.contains('iti__search-input')) {
          if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
          }
        }
      }, true);
      
      // Also stop when dropdown closes
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.iti')) {
          if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
          }
        }
      });
    }, 500);
  }

  employeesSizes = [
    { value: '1-10', viewValue: '1-10' },
    { value: '10-20', viewValue: '10-20' },
    { value: '20-50', viewValue: '20-50' },
    { value: '50-100', viewValue: '50-100' },
    { value: '100+', viewValue: '100+' }
  ];

  errorMessage: string = '';
  countries: string[] = [];
  industries: any[] = [];
  isValidVatNumber: boolean = false;
  showCompanyDetails: boolean = false;
  registrationSuccess = false; // Added
  isLoading = false; // Loading spinner for register

  referralCodeValidating = false;
  referralCodeValid: boolean | null = null;
  referralCodeMessage = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private companyService: CompanyService, private industryService: IndustryService, private router: Router, private snackBar: MatSnackBar, private companyValidationService: CompanyValidationService, private http: HttpClient) {
    this.registrationForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern("^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ .'-]{2,50}$") 
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern("^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ .'-]{2,50}$") 
      ]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8), 
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      lang: ['bg', Validators.required],
      referredByCode: ['', [Validators.maxLength(20)]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
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

  // Custom validator for password matching
  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPasswordControl = form.get('confirmPassword');
    
    if (!confirmPasswordControl) return null;

    const confirmPassword = confirmPasswordControl.value;

    // If confirm password is empty, let 'required' validator handle it
    if (!confirmPassword) {
      return null;
    }

    if (password !== confirmPassword) {
      confirmPasswordControl.setErrors({ passwordMismatch: true });
    } else {
      // Only clear if the error is currently passwordMismatch
      if (confirmPasswordControl.hasError('passwordMismatch')) {
        confirmPasswordControl.setErrors(null);
      }
    }
    return null;
  }

  ngOnInit() {
    this.getCountryNames();
    
    // Watch for referral code changes and validate
    this.registrationForm.get('referredByCode')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(code => {
      this.validateReferralCode(code);
    });
  }

  validateReferralCode(code: string): void {
    if (!code || code.trim() === '') {
      this.referralCodeValid = null;
      this.referralCodeMessage = '';
      this.referralCodeValidating = false;
      return;
    }

    this.referralCodeValidating = true;
    this.referralCodeMessage = '';

    this.http.get<{ valid: boolean }>(`${environment.apiUrl}/api/referral/validate`, {
      params: { code: code.trim().toUpperCase() }
    }).subscribe({
      next: (response) => {
        this.referralCodeValidating = false;
        this.referralCodeValid = response.valid;
        this.referralCodeMessage = response.valid 
          ? '✓ Валиден код от препоръка' 
          : '✗ Невалиден код от препоръка';
      },
      error: () => {
        this.referralCodeValidating = false;
        this.referralCodeValid = false;
        this.referralCodeMessage = '✗ Грешка при валидация на кода';
      }
    });
  }

  onLogoChanged(logo: File | null): void {
    this.selectedCompanyLogo = logo;
    console.log('RegisterComponent: onLogoChanged called, selectedCompanyLogo:', this.selectedCompanyLogo); // DEBUG
  }

  onCompanyFormSubmit(companyData: any) {
    this.companyFormData = companyData;
  }

  onCompanyValidate(data: { vatNumber: string, country: string }) {
    this.companyValidationService.validateCompany(data.vatNumber, data.country, {
      onSuccess: () => {
        this.isValidVatNumber = true;
        this.showCompanyDetails = true;
        this.getIndustries(data.country);
        if (this.companyFormComponentRef) {
          this.companyFormComponentRef.setCompanyDetailsVisible(true);
          this.companyFormComponentRef.setVatValid(true);
        }
      },
      onError: () => {
        this.isValidVatNumber = false;
        this.showCompanyDetails = false;
        if (this.companyFormComponentRef) {
          this.companyFormComponentRef.setCompanyDetailsVisible(false);
          this.companyFormComponentRef.setVatValid(false);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.registrationForm.valid && this.companyFormComponentRef && this.companyFormComponentRef.companyForm.valid) {
      this.isLoading = true;
      const registrationData = this.registrationForm.value;
      const companyData = this.companyFormComponentRef.companyForm.getRawValue();
      
      // Extract phone number in international format
      const phoneData = registrationData.phoneNumber;
      const phoneNumber = phoneData?.e164Number || phoneData?.internationalNumber || null;
      
      // Include referredByCode if provided and valid (or empty)
      const requestPayload = {
        ...registrationData,
        phoneNumber: phoneNumber,
        referredByCode: registrationData.referredByCode?.trim() || undefined,
        companyInfo: companyData 
      };
      
      const logoToUpload = this.selectedCompanyLogo ? this.selectedCompanyLogo : undefined;
      this.authService.register(requestPayload, logoToUpload).pipe(
        tap({
          next: (registerResponse: any) => { 
           const loginCredentials = {
              email: requestPayload.email,
              password: requestPayload.password 
            };
            this.authService.login(loginCredentials).subscribe({
              next: (loginResponse) => {
                this.isLoading = false;
                console.log('Auto-login successful after registration:', loginResponse);
              },
              error: (loginError) => {
                this.isLoading = false;
                console.error('Auto-login failed after registration:', loginError);
                this.snackBar.open('Регистрацията е успешна, но автоматичният вход се провали. Моля, влезте ръчно.', 'Затвори', {
                  duration: 5000,
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: ['warning-snackbar']
                });
                this.router.navigate(['/login']);
              }
            });
          },
          error: (registerError) => {
            this.isLoading = false;
            console.error('Registration failed:', registerError);
            let errorMessage = 'Регистрацията се провали. Моля, опитайте отново.';
            if (registerError.error && registerError.error.message) {
              errorMessage = registerError.error.message; 
            }
            this.snackBar.open('✗ ' + errorMessage, 'Затвори', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        })
      ).subscribe({
        error: () => {} // Empty error handler to prevent unhandled error
      });
    } else {
      this.snackBar.open('✗ Моля, попълнете правилно всички задължителни полета в потребителската и фирмена формa.', 'Затвори', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }

  getDataFromOutside(): void {
    const vatNumber = this.companyFormComponentRef?.companyForm.get('vatNumber')?.value;
    const country = this.companyFormComponentRef?.companyForm.get('country')?.value;

    if (!vatNumber || !country) {
      this.snackBar.open('✗ Моля, изберете държава и въведете ДДС/ЕИК номер първо.', 'Затвори', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.companyService.getCompanyInfoFromOutside(vatNumber, country).subscribe({
      next: response => {
        this.isValidVatNumber = true;
        this.errorMessage = '';
        this.showCompanyDetails = true;
        if (this.companyFormComponentRef) {
          this.companyFormComponentRef.setCompanyDetailsVisible(true);
          this.companyFormComponentRef.setVatValid(true);
        }
        this.getIndustries(country); 
      },
      error: error => {
        this.isValidVatNumber = false;
        this.showCompanyDetails = false;
        if (error.status === 404) {
          this.errorMessage = 'Фирмата не е намерена в регистъра.';
        } else if (error.status === 400) {
          this.errorMessage = 'Фирмата вече съществува в базата данни.';
        } else {
          this.errorMessage = 'Възникна неочаквана грешка. Опитайте отново.';
        }
        this.snackBar.open('✗ ' + this.errorMessage, 'Затвори', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getCountryNames(): void {
    this.companyService.getCountryNames().subscribe((data: any[]) => {
      this.countries = data.map(country => country);
    });
  }

  getIndustries(country?: string): void {
    const companyFormCountry = this.companyFormComponentRef?.companyForm.get('country')?.value;
    const selectedCountry = country || companyFormCountry;

    if (!selectedCountry) {
      this.industries = []; 
      return;
    }
    this.industryService.getAllIndustries(selectedCountry).subscribe({
      next: (response) => {
        this.industries = response.map((industry: any) => ({
          value: industry.value || '',
          viewValue: industry.viewValue || ''
        }));
        this.errorMessage = '';
      },
      error: (error) => {
        this.industries = [];
        if (error.status === 404) {
          this.errorMessage = 'Няма индустрии за тази държава.';
        } else {
          this.errorMessage = 'Възникна неочаквана грешка при зареждане на индустрии.';
        }
      }
    });
  }

  countriesSelected(event: any) {
    const selectedValue = event.value;
    this.registrationForm.patchValue({ companyCity: '', companyAddress: '' });
    this.getIndustries();
  }

  industrySelected(event: any) {
    const selectedValue = event.value;
  }

  vatNumberChanged(event: any) {
    const vatNumber = event.target.value;
    this.isValidVatNumber = false;
    this.showCompanyDetails = false;
    this.errorMessage = '';
    if (vatNumber && vatNumber.trim() !== '') {
      this.getDataFromOutside();
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.countries.filter(option => option.toLowerCase().includes(filterValue));
  }
}
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core'; // Import AfterViewInit
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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


@Component({
  standalone: true,
  selector: 'app-registration-form',
  imports: [ReactiveFormsModule, CommonModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatDividerModule, MatOptionModule, MatSelectModule, CompanyFormComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, AfterViewInit { 
  registrationForm: FormGroup;
  companyFormData: any = null;
  selectedCompanyLogo: File | null = null; 
  @ViewChild('companyFormComponent') companyFormComponentRef!: CompanyFormComponent;

  ngAfterViewInit(): void {
    // This method is required by the AfterViewInit interface.
    // You can add any initialization logic here if needed.
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

  constructor(private fb: FormBuilder, private authService: AuthService, private companyService: CompanyService, private industryService: IndustryService, private router: Router) {
    this.registrationForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      lang: ['bg', Validators.required]
    });
  }

  ngOnInit() {
    this.getCountryNames();
  }

  onLogoChanged(logo: File | null): void {
    this.selectedCompanyLogo = logo;
    console.log('RegisterComponent: onLogoChanged called, selectedCompanyLogo:', this.selectedCompanyLogo); // DEBUG
  }

  onCompanyFormSubmit(companyData: any) {
    this.companyFormData = companyData;
  }

  onCompanyValidate(data: { vatNumber: string, country: string }) {
    this.companyService.getCompanyInfoFromOutside(data.vatNumber, data.country).subscribe({
      next: () => {
        this.isValidVatNumber = true;
        this.showCompanyDetails = true;
        this.getIndustries(data.country);
        if (this.companyFormComponentRef) {
          this.companyFormComponentRef.setCompanyDetailsVisible(true);
          this.companyFormComponentRef.setVatValid(true);
        }
        alert('Компанията е валидирана успешно!');
      },
      error: (error) => {
        this.isValidVatNumber = false;
        this.showCompanyDetails = false;
        if (this.companyFormComponentRef) {
          this.companyFormComponentRef.setCompanyDetailsVisible(false);
          this.companyFormComponentRef.setVatValid(false);
        }
        if (error.status === 404) {
          alert('Компанията не е намерена в регистъра.');
        } else if (error.status === 400) {
          alert('Компанията вече съществува в базата данни.');
        } else {
          alert('Възникна неочаквана грешка. Опитайте отново.');
        }
      }
    });
  }

  onSubmit(): void {
    if (this.registrationForm.valid && this.companyFormComponentRef && this.companyFormComponentRef.companyForm.valid) {
      const registrationData = this.registrationForm.value;
      const companyData = this.companyFormComponentRef.companyForm.getRawValue();

      const requestPayload = {
        ...registrationData, 
        companyInfo: companyData 
      };

      const logoToUpload = this.selectedCompanyLogo ? this.selectedCompanyLogo : undefined;

      this.authService.register(requestPayload, logoToUpload).pipe(
        tap({
          next: (registerResponse: any) => { 
           const loginCredentials = {
              email: requestPayload.email,
              password: requestPayload.password // Уверете се, че requestPayload.password е оригиналната парола
            };
            this.authService.login(loginCredentials).subscribe({
              next: (loginResponse) => {
                console.log('Auto-login successful after registration:', loginResponse);
                // AuthService.login вече пренасочва към /companies при успех
                // this.registrationSuccess = true; // Може да остане, ако е нужно за други цели
              },
              error: (loginError) => {
                console.error('Auto-login failed after registration:', loginError);
                // Показване на съобщение, че регистрацията е успешна, но автоматичното логване не е
                // и потребителят трябва да се логне ръчно.
                alert('Registration successful, but auto-login failed. Please log in manually.');
                this.router.navigate(['/login']);
              }
            });
          },
          error: (registerError) => {
            console.error('Registration failed:', registerError);
            let errorMessage = 'Registration failed. Please try again.';
            if (registerError.error && registerError.error.message) {
              errorMessage = registerError.error.message; 
            }
            alert(errorMessage);
          }
        })
      ).subscribe();
    } else {
      alert('Please fill out all required fields correctly in both user and company forms.');
    }
  }

  getDataFromOutside(): void {
    const vatNumber = this.companyFormComponentRef?.companyForm.get('vatNumber')?.value;
    const country = this.companyFormComponentRef?.companyForm.get('country')?.value;

    if (!vatNumber || !country) {
      alert('Please select a country and enter a VAT number in the company form first.');
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
          this.errorMessage = 'Компанията не е намерена в регистъра.';
        } else if (error.status === 400) {
          this.errorMessage = 'Компанията вече съществува в базата данни.';
        } else {
          this.errorMessage = 'Възникна неочаквана грешка. Опитайте отново.';
        }
        alert(this.errorMessage);
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
import { CommonModule } from '@angular/common';
import { Component, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CompanyService } from '../../service/company.service';
import { IndustryService } from '../../service/industry.service'
import { tap } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Industry } from '../../model/industry'
import { Router } from '@angular/router';
import { CompanyFormComponent } from '../company-form/company-form.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CompanyValidationService } from '../../service/company-validation.service';

@Component({
  selector: 'app-create-company',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    CompanyFormComponent,
    MatSnackBarModule
  ],
  templateUrl: './create-company.component.html',
  styleUrls: ['./create-company.component.scss']
})
export class CreateCompanyComponent {
  @ViewChild('companyFormComponent') companyFormComponentRef!: CompanyFormComponent;
  @Output() companyCreated = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  
  countries: string[] = [];
  employeesSizes = [
    { value: '1-10', viewValue: '1-10' },
    { value: '10-20', viewValue: '10-20' },
    { value: '20-50', viewValue: '20-50' },
    { value: '50-100', viewValue: '50-100' },
    { value: '100+', viewValue: '100+' }
  ];
  isBulgaria: boolean = false;
  isSpecialBulgarian: boolean = false;
  isValidVatNumber: boolean = false;
  errorMessage: any;
  showCompanyDetails: boolean = false;
  industries: Industry[] = [];
  selectedLogo: File | null = null;

  constructor(private fb: FormBuilder, private companyService: CompanyService, private industryService: IndustryService, private router: Router, private snackBar: MatSnackBar, private companyValidationService: CompanyValidationService) {
    this.getCountryNames();
  }

  onCompanyFormSubmit(companyData: any) {
    console.log('🏢 Creating company...', companyData);
    const formData = new FormData();
    formData.append('company', new Blob([JSON.stringify(companyData)], { type: 'application/json' }));
    if (this.selectedLogo) {
      formData.append('logo', this.selectedLogo);
    }
    this.companyService.createCompany(formData).pipe(
      tap({
        next: (response: any) => {
          console.log('✅ Company created successfully:', response);
          this.companyValidationService.showCompanyCreatedSuccess();
          this.companyCreated.emit(); 
        },
        error: (error: any) => {
          console.error('❌ Company creation failed:', error);
          this.companyValidationService.showCompanyCreationError();
        }
      })
    ).subscribe();
  }

  onCompanyValidate(data: { vatNumber: string, country: string }) {
    this.companyValidationService.validateCompany(data.vatNumber, data.country, {
      onSuccess: () => {
        this.isValidVatNumber = true;
        this.showCompanyDetails = true;
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

  getCountryNames(): void {
    this.companyService.getCountryNames().subscribe((data: any[]) => {
      this.countries = data.map(country => country);
    });
  }

  getIndustries(country?: string): void {
    const selectedCountry = country || (this.countries.length > 0 ? this.countries[0] : null);
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

  onCountryChanged(event: any) {
    const selectedCountry = event.value;
    this.getIndustries(selectedCountry);
  }

  onLogoChange(logo: File | null) {
    this.selectedLogo = logo;
  }

  onCancelCompanyForm() {
    console.log('🔸 Company creation cancelled');
    this.cancelled.emit(); 
  }

  submitForm(): void {
    console.log('🏢 Submit form called from modal buttons');
    if (this.companyFormComponentRef && this.canSubmit()) {
      this.companyFormComponentRef.onSubmit();
    }
  }

  canSubmit(): boolean {
    return this.companyFormComponentRef && 
           this.companyFormComponentRef.companyForm.valid && 
           this.isValidVatNumber && 
           this.showCompanyDetails;
  }
}

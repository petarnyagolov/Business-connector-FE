import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-create-company',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    CompanyFormComponent
  ],
  templateUrl: './create-company.component.html',
  styleUrls: ['./create-company.component.scss']
})
export class CreateCompanyComponent {
  @ViewChild('companyFormComponent') companyFormComponentRef!: CompanyFormComponent;
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

  constructor(private fb: FormBuilder, private companyService: CompanyService, private industryService: IndustryService, private router: Router) {
    this.getCountryNames();
  }

  onCompanyFormSubmit(companyData: any) {
    this.companyService.createCompany(companyData).pipe(
      tap({
        next: (response: any) => {
          alert('You have a company!');
          this.router.navigate(['/user/companies']);
        },
        error: (error: any) => {
          alert('Registration failed. Please try again.');
        }
      })
    ).subscribe();
  }

  onCompanyValidate(data: { vatNumber: string, country: string }) {
    this.companyService.getCompanyInfoFromOutside(data.vatNumber, data.country).subscribe({
      next: () => {
        this.isValidVatNumber = true;
        this.showCompanyDetails = true;
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
}

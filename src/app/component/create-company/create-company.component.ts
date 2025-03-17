import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CompanyService } from '../../service/company.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-create-company',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-company.component.html',
  styleUrl: './create-company.component.scss'
})
export class CreateCompanyComponent {
  createCompanyForm: FormGroup;
  countries: string[] = [];
  isBulgaria: boolean = false;
  isValidVatNumber: boolean = false;
  errorMessage: any;
  showCompanyDetails: boolean = false;

  constructor(private fb: FormBuilder, private companyService: CompanyService) {
    this.createCompanyForm = this.fb.group({
      country: ['', Validators.required],
      vatNumber: ['', Validators.required],
      name: ['', Validators.required],
      person: [''],
      activity: [''],
      city: [''],
      address: [''],
      phone: [''],
      email: ['', [Validators.email]],
      founded: [null],
      size: [0],
      description: [''],
      industry: ['Unknown']
    });
    this.getCountryNames();
  }

  onSubmit(): void {
    if (this.createCompanyForm.valid) {
      const formData = this.createCompanyForm.value;
      this.companyService.createCompany(formData).pipe(

        tap({
          next: (response: any) => {
            console.log('Response:', response);
            alert('Registration successful!');

            if (!formData) {
              console.error("formData is null or undefined");
              return;
            }

            this.companyService.createCompany({
              country: formData?.country,
              vatNumber: formData?.vatNumber,
              name: formData?.Name,
              person: formData?.person,
              activity: formData?.activity,
              city: formData?.city,
              address: formData.address,
              phone: formData?.phone ?? '',
              email: formData?.email ?? '',
              founded: formData?.founded ?? null,
              size: formData?.size ?? 0,
              description: formData?.description ?? '',
              industry: formData?.industry ?? 'Unknown'
            });
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

  getDataFromOutside(): void {
    const vatNumber = this.createCompanyForm.get('vatNumber')?.value;
    const country = this.createCompanyForm.get('country')?.value;
  
  
      this.companyService.getCompanyInfoFromOutside(vatNumber, country).subscribe({
        next: response => {
          console.log('Company info:', response);
          this.isValidVatNumber = true;
          this.errorMessage = ''; // Clear any previous error messages
          this.showCompanyDetails = true;

        },
        error: error => {
          if (error.status === 404) {
            this.errorMessage = 'Компанията не е намерена в регистъра.';
          } else if (error.status === 400) {
            this.errorMessage = 'Компанията вече съществува в базата данни.';
          } else {
            this.errorMessage = 'Възникна неочаквана грешка. Опитайте отново.';
          }
          console.error('Error fetching company info:', error);
        }
      });
    
  }
  
  getCountryNames(): void {
    this.companyService.getCountryNames().subscribe((data: any[]) => {
      this.countries = data.map(country => country);
    });

  }

}

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyRequestService } from '../../service/company-request.service';
import { CompanyService } from '../../service/company.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Company } from '../../model/company';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-create-request',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatRadioModule
  ],
  templateUrl: './create-request.component.html',
  styleUrl: './create-request.component.scss'
})
export class CreateRequestComponent {
  requestForm: FormGroup;
  selectedFiles: File[] = [];
  userCompanies: Company[] = [];
  private userCompaniesLoaded = false;

  constructor(
    private fb: FormBuilder,
    private companyRequestService: CompanyRequestService,
    private companyService: CompanyService,
    private router: Router
  ) {
    this.requestForm = this.fb.group({
      company: ['', Validators.required],
      title: ['', Validators.required],
      requestType: ['', Validators.required],
      description: [''],
      status: ['', Validators.required],
      activeFrom: ['', Validators.required],
      activeTo: ['', Validators.required],
      urgent: [false],
      serviceType: [''],
      capacity: [''],
      workMode: [''],
      priceFrom: [''],
      priceTo: [''],
      unit: ['']
    });
    this.loadUserCompanies();
  }

  loadUserCompanies(): void {
    if (this.userCompaniesLoaded) return;
    this.companyService.getAllCompaniesByUser().subscribe({
      next: (companies) => {
        this.userCompanies = companies;
        this.userCompaniesLoaded = true;
      },
      error: () => {
        this.userCompanies = [];
        this.userCompaniesLoaded = true;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  onSubmit(): void {
    if (this.requestForm.invalid) return;
    const formData = new FormData();
    const formValue = this.requestForm.value;
    // company е vatNumber
    const selectedCompany = this.userCompanies.find(c => c.vatNumber === formValue.company);
    if (selectedCompany) {
      // Създаваме обект за requestCompany
      const requestCompany = {
        requesterName: selectedCompany.name,
        requesterVatNumber: selectedCompany.vatNumber,
        title: formValue.title,
        requestType: formValue.requestType,
        description: formValue.description,
        status: formValue.status,
        activeFrom: formValue.activeFrom,
        activeTo: formValue.activeTo
      };
      formData.append('requestCompany', new Blob([JSON.stringify(requestCompany)], { type: 'application/json' }));
    }
    this.selectedFiles.forEach(file => formData.append('pictures', file));
    this.companyRequestService.createRequest(formData).subscribe({
      next: () => this.router.navigate(['/requests/my-requests']),
      error: err => alert('Грешка при създаване на заявка!')
    });
  }

  onCancel(): void {
    this.router.navigate(['/requests/my-requests']);
  }
}

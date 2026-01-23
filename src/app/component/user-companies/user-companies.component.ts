import { Component, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {MatGridListModule} from '@angular/material/grid-list';
import { MatCardModule, MatCardContent} from '@angular/material/card';
import {  MatButtonModule } from '@angular/material/button';
import { MatFabButton } from '@angular/material/button';
import { Company } from '../../model/company';
import { CompanyService } from '../../service/company.service';
import { filter, takeUntil } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { environment } from '../../../environments/environment';
import { forkJoin, of, Subject } from 'rxjs';
import { CreateCompanyComponent } from '../create-company/create-company.component';
import { EditCompanyComponent } from '../edit-company/edit-company.component';
import { CompanyInvoiceDataService } from '../../service/company-invoice-data.service';
import { CompanyInvoiceData } from '../../model/company-invoice-data';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-companies',
  imports: [RouterOutlet, CommonModule, MatGridListModule, MatCardModule, MatButtonModule, MatFabButton, MatCardContent, MatIcon, CreateCompanyComponent, EditCompanyComponent, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './user-companies.component.html',
  styleUrl: './user-companies.component.scss',
  standalone: true
})
export class UserCompaniesComponent implements OnDestroy {
  @ViewChild('createCompanyModal') createCompanyModal!: CreateCompanyComponent;
  companies: Company[] = [];
  logoUrls: { [key: string]: string } = {};
  private logoObjectUrls: string[] = []; 
  private destroy$ = new Subject<void>();
  
  showCreateCompanyModal = false;
  showEditCompanyModal = false;
  selectedCompany: Company | null = null;
  
  showInvoiceDataModal = false;
  invoiceDataForm: FormGroup;
  currentInvoiceCompany: Company | null = null;
  isLoadingInvoiceData = false;


  
constructor(private router: Router, private companyService: CompanyService, private cdr: ChangeDetectorRef, private invoiceDataService: CompanyInvoiceDataService, private snackBar: MatSnackBar, private fb: FormBuilder) {
  this.invoiceDataForm = this.fb.group({
    invoiceName: ['', [Validators.required, Validators.maxLength(255)]],
    vatNumber: ['', [Validators.required, Validators.maxLength(50)]],
    invoiceAddress: ['', [Validators.required, Validators.maxLength(255)]],
    mol: ['', [Validators.maxLength(255)]]
  });
}


ngOnInit(): void {
  this.loadCompanies();

  this.router.events
    .pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    )
    .subscribe(() => {
      this.loadCompanies();
    });
}

loadCompanies(): void {
  console.log('🔄 Loading companies...');
  this.companyService.getAllCompaniesByUser()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
    next: (data: Company[]) => {
      console.log('✅ Companies loaded:', data.length, 'companies');
      console.log('📊 Company names:', data.map(c => c.name));
      this.companies = data.sort((a, b) => {
        const aHasLogo = !!(a.logo && this.logoUrls[a.logo]);
        const bHasLogo = !!(b.logo && this.logoUrls[b.logo]);
        if (aHasLogo === bHasLogo) return 0;
        return bHasLogo ? 1 : -1;
      });
      this.loadAllLogos();
      console.log('Loaded companies:', this.companies);
    },
    error: (error) => {
      console.error('❌ Error fetching companies:', error);
    }
  });
}

loadAllLogos(): void {
  const currentIds = this.companies.map(c => c.id?.toString()).filter(Boolean);
  Object.keys(this.logoUrls).forEach(id => {
    if (!currentIds.includes(id)) {
      URL.revokeObjectURL(this.logoUrls[id]);
      delete this.logoUrls[id];
    }
  });

  const logoObservables = this.companies.map(company => {
    const id = company.id?.toString();
    const logoPath = company.logo || company.logoPath;
    if (!id) return of(null);
    if (!logoPath) {
      this.logoUrls[id] = '';
      return of(null);
    }
    if (this.logoUrls[id]) {
      return of(null);
    }
    const cleanPath = logoPath.replace(/\\/g, '/');
    return this.companyService.getLogoByPath(cleanPath).pipe(
    );
  });

  forkJoin(logoObservables).subscribe((blobs) => {
    this.companies.forEach((company, idx) => {
      const id = company.id?.toString();
      const blob = blobs[idx];
      if (!id) return;
      if (blob instanceof Blob) {
        const objectUrl = URL.createObjectURL(blob);
        this.logoUrls[id] = objectUrl;
      } else if (!this.logoUrls[id]) {
        this.logoUrls[id] = '';
      }
    });
    this.logoUrls = { ...this.logoUrls };
    this.cdr.detectChanges();
  });
}

getLogoUrl(company: Company): string {
  const logoPath = company.logo || company.logoPath;
  if (!logoPath) return '';
  if (logoPath.startsWith('http')) return logoPath;
  return `${environment.apiUrl}/files/${logoPath.replace(/^\\+|\\+$/g, '').replace(/\\/g, '/')}`;
}

  createCompany() {
    this.router.navigate(['/user/companies/create']);
    setTimeout(() => {
      const formEl = document.querySelector('.company-form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }

  openEditCompanyModal(company: Company) {
    this.selectedCompany = company;
    this.showEditCompanyModal = true;
  }

  closeEditCompanyModal() {
    this.showEditCompanyModal = false;
    this.selectedCompany = null;
  }

  onCompanyUpdated(updatedCompany: Company) {
    this.loadCompanies(); 
    this.closeEditCompanyModal();
  }
  
  getGridColumns(): number {
    if (this.companies.length === 1) {
      return 1; 
    } else if (this.companies.length === 2) {
      return 2;
    } else {
      return 3; 
    }
  }

  getRowHeight(): string {
    if (this.companies.length === 1) {
      return '4:3'; 
    } else if (this.companies.length === 2) {
      return '3:2';
    } else {
      return '2:1';
    }
  }

  getColSpan(): number {
    if (this.companies.length === 1) {
      return 1; 
    } else {
      return 1; 
    }
  }

  getRowSpan(): number {
    if (this.companies.length === 1) {
      return 2;
    } else if (this.companies.length === 2) {
      return 2;
    } else {
      return 2; 
    }
  }

  logoLoadError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  getEmployeesSize(company: any): string {
    return company && company.employeesSize ? company.employeesSize : '-';
  }

  openCreateCompanyModal(): void {
    console.log('🔹 Opening create company modal');
    this.showCreateCompanyModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeCreateCompanyModal(): void {
    console.log('🔹 Closing create company modal');
    this.showCreateCompanyModal = false;
    document.body.style.overflow = 'auto';
  }

  openInvoiceDataModal(company: Company): void {
    if (!company.id) {
      this.snackBar.open('❌ Грешка: липсва ID на компанията', 'Затвори', { duration: 3000 });
      return;
    }
    
    this.currentInvoiceCompany = company;
    this.isLoadingInvoiceData = true;
    this.showInvoiceDataModal = true;
    document.body.style.overflow = 'hidden';
    
    // Зареждаме съществуващи данни или попълваме от компанията
    this.invoiceDataService.getInvoiceData(company.id).subscribe({
      next: (data) => {
        this.invoiceDataForm.patchValue({
          invoiceName: data.invoiceName || company.name,
          vatNumber: data.vatNumber || company.vatNumber,
          invoiceAddress: data.invoiceAddress || company.address,
          mol: data.mol || ''
        });
        this.isLoadingInvoiceData = false;
      },
      error: (err) => {
        // Ако няма данни (404), попълваме от компанията
        if (err.status === 404) {
          this.invoiceDataForm.patchValue({
            invoiceName: company.name,
            vatNumber: company.vatNumber,
            invoiceAddress: company.address,
            mol: ''
          });
        } else {
          this.snackBar.open('❌ Грешка при зареждане на данните', 'Затвори', { duration: 3000 });
        }
        this.isLoadingInvoiceData = false;
      }
    });
  }

  closeInvoiceDataModal(): void {
    this.showInvoiceDataModal = false;
    this.currentInvoiceCompany = null;
    this.invoiceDataForm.reset();
    document.body.style.overflow = 'auto';
  }

  saveInvoiceData(): void {
    if (!this.currentInvoiceCompany?.id || this.invoiceDataForm.invalid) {
      this.snackBar.open('❌ Моля, попълнете всички задължителни полета', 'Затвори', { duration: 3000 });
      return;
    }
    
    this.isLoadingInvoiceData = true;
    const formValue = this.invoiceDataForm.value;
    
    this.invoiceDataService.createOrUpdateInvoiceData(this.currentInvoiceCompany.id, formValue).subscribe({
      next: () => {
        this.snackBar.open('✅ Фактурните данни са запазени успешно!', 'Затвори', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.closeInvoiceDataModal();
      },
      error: (err) => {
        console.error('Error saving invoice data:', err);
        this.snackBar.open('❌ Грешка при запазване на данните', 'Затвори', { duration: 4000 });
        this.isLoadingInvoiceData = false;
      }
    });
  }

  onCompanyCreated(): void {
    console.log('🎉 Company created successfully!');
    console.log('📋 Current companies count before reload:', this.companies.length);
    this.closeCreateCompanyModal();
    setTimeout(() => {
      console.log('🔄 Refreshing companies list...');
      this.loadCompanies();
    }, 100); 
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    this.logoObjectUrls.forEach(url => URL.revokeObjectURL(url));
  }
}

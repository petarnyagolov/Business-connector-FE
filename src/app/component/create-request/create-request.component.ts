import { Component, OnDestroy } from '@angular/core';
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
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ReactiveFormsModule } from '@angular/forms';
import { Company } from '../../model/company';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { EmailVerificationService } from '../../service/email-verification.service';
import { CreditsService } from '../../service/credits.service';
import { NotificationService } from '../../service/notification.service';

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
    MatMomentDateModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatIconModule
  ],
  templateUrl: './create-request.component.html',
  styleUrl: './create-request.component.scss'
})
export class CreateRequestComponent implements OnDestroy {
  requestForm: FormGroup;
  selectedFiles: File[] = [];
  userCompanies: Company[] = [];
  filePreview: string | null = null;
  previewType: 'image' | 'pdf' | null = null;
  private userCompaniesLoaded = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private companyRequestService: CompanyRequestService,
    private companyService: CompanyService,
    private router: Router,
    private authService: AuthService,
    private emailVerificationService: EmailVerificationService,
    public creditsService: CreditsService,
    private notificationService: NotificationService
  ) {
    console.log('🚀 CreateRequestComponent constructor called - TESTING');
    this.requestForm = this.fb.group({
      company: ['', Validators.required],
      region: ['', [Validators.required, Validators.maxLength(50)]],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      requestType: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      activeFrom: [''],
      activeTo: [''],
      urgent: [false],
      serviceType: [''],
      capacity: [''],
      workMode: [''],
      priceFrom: [''],
      priceTo: [''],
      unit: [''],
      requiredFields: [[]]
    });
    this.loadUserCompanies();
  }

  loadUserCompanies(): void {
    if (this.userCompaniesLoaded) return;
    this.companyService.getAllCompaniesByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logFormStatus(): void {
    this.notificationService.info('Debug mode activated');
    console.log('🔍 DEBUG BUTTON CLICKED!');
    console.log('📊 Form valid:', this.requestForm.valid);
    console.log('📊 Form invalid:', this.requestForm.invalid);
    console.log('📊 Form errors:', this.requestForm.errors);
    
    Object.keys(this.requestForm.controls).forEach(key => {
      const control = this.requestForm.get(key);
      if (control && control.invalid) {
        console.log(`❌ Field "${key}" is invalid:`, control.errors);
      } else if (control && control.valid) {
        console.log(`✅ Field "${key}" is valid:`, control.value);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log('Files selected:', input.files);
      
      const maxFileSize = 25 * 1024 * 1024; 
      
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        
        if (file.size > maxFileSize) {
          this.notificationService.warning(`Файлът "${file.name}" е твърде голям (${(file.size / (1024 * 1024)).toFixed(2)}MB). Максималният размер е 25MB.`);
          console.warn('File too large:', file.name, `${(file.size / (1024 * 1024)).toFixed(2)}MB`);
          continue; 
        }
        
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          const isDuplicate = this.selectedFiles.some(f => f.name === file.name && f.size === file.size);
          if (!isDuplicate) {
            this.selectedFiles.push(file);
          } else {
            console.warn('File already selected, skipping:', file.name);
          }
        } else {
          console.warn('Unsupported file type ignored:', file.type);
          this.notificationService.warning('Неподдържан тип файл: ' + file.name + '. Моля, използвайте само изображения или PDF файлове.');
        }
      }
      
      console.log('Selected files:', this.selectedFiles);
      
      if (this.selectedFiles.length > 0) {
        this.updateFilePreview(this.selectedFiles[0]);
      } else {
        this.previewType = null;
        this.filePreview = null;
      }
    }
  }
 
  removeFile(index: number): void {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
      console.log('File removed. Remaining files:', this.selectedFiles);
      
      if (this.selectedFiles.length === 0) {
        this.filePreview = null;
        this.previewType = null;
      } else if (index === 0) {
        this.updateFilePreview(this.selectedFiles[0]);
      }
    }
  }

  updateFilePreview(file: File): void {
    if (file.type.startsWith('image/')) {
      this.previewType = 'image';
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      this.previewType = 'pdf';
      this.filePreview = 'pdf'; 
    } else {
      this.previewType = null;
      this.filePreview = null;
    }
  }

  onSubmit(): void {
    console.log('🎯 onSubmit called');
    
    const currentCredits = this.creditsService.getCurrentCredits();
    if (currentCredits <= 0) {
      this.notificationService.error('Нямате достатъчно кредити за създаване на публикация. Моля, закупете кредити.');
      return;
    }
    
    console.log('📧 Checking email verification...');
    
    this.emailVerificationService.checkVerificationOrPrompt().subscribe({
      next: (canProceed: boolean) => {
        console.log('📧 Email verification result:', canProceed);
        if (!canProceed) {
          console.log('❌ Cannot proceed - email verification failed');
          return; 
        }
        
        console.log('✅ Email verification passed, proceeding to form submission');
        this.processFormSubmission();
      },
      error: (error) => {
        console.error('❌ Error during email verification check:', error);
      }
    });
  }

  private processFormSubmission(): void {
    console.log('🚀 Starting processFormSubmission...');
    
    if (this.requestForm.invalid) {
      console.error('❌ Form is invalid!');
      console.error('Form errors:', this.requestForm.errors);
      Object.keys(this.requestForm.controls).forEach(key => {
        const control = this.requestForm.get(key);
        if (control && control.invalid) {
          console.error(`Field "${key}" is invalid:`, control.errors);
        }
      });
      return;
    }
    
    const maxFileSize = 25 * 1024 * 1024; 
    const oversizedFiles = this.selectedFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => `${f.name} (${(f.size / (1024 * 1024)).toFixed(2)}MB)`).join(', ');
      this.notificationService.warning(`Следните файлове са твърде големи: ${fileNames}. Максималният размер е 25MB на файл.`);
      return;
    }
    
    console.log('✅ Form is valid, proceeding...');
    const formData = new FormData();
    const formValue = this.requestForm.value;
    console.log('📝 Form values:', formValue);
    
    const selectedCompany = this.userCompanies.find(c => c.vatNumber === formValue.company);
    console.log('🏢 Selected company:', selectedCompany);
    if (selectedCompany) {
      console.log('✅ Company found, preparing request data...');
      const toLocalDateString = (date: any) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}T00:00:00`;
      };
      const requestCompany = {
        requesterName: selectedCompany.name,
        requesterCompanyId: selectedCompany.id,
        region: formValue.region,
        title: formValue.title,
        requestType: formValue.requestType,
        description: formValue.description,
        activeFrom: toLocalDateString(formValue.activeFrom),
        activeTo: toLocalDateString(formValue.activeTo),
        urgent: formValue.urgent,
        serviceType: formValue.serviceType,
        capacity: formValue.capacity,
        workMode: formValue.workMode,
        priceFrom: formValue.priceFrom,
        priceTo: formValue.priceTo,
        unit: formValue.unit,
        requiredFields: formValue.requiredFields || []
      };
      
      console.log('📋 Request data prepared:', requestCompany);
      formData.append('requestCompany', new Blob([JSON.stringify(requestCompany)], { type: 'application/json' }));
    } else {
      console.error('❌ No company selected or company not found!');
      return;
    }
    if (this.selectedFiles.length > 0) {
      console.log(`📎 Adding ${this.selectedFiles.length} files to the request:`);
      this.selectedFiles.forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.name} (${file.type}, ${file.size} bytes)`);
        formData.append('files', file, file.name);
      });
    } else {
      console.log('📎 No files attached to the request');
    }
    
    console.log('📦 FormData entries:');
    for (const pair of (formData as any).entries()) {
      console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
    }
    
    console.log('🌐 Calling companyRequestService.createRequest...');
    
    this.companyRequestService.createRequest(formData).subscribe({
      next: (response) => {
        console.log('✅ Request created successfully:', response);
        
        // Decrement credits after successful creation
        this.creditsService.decrementCredits();
        
        this.router.navigate(['/my-requests']);
      },
      error: err => {
        console.error('❌ Error creating request:', err);
        console.error('❌ Error status:', err.status);
        console.error('❌ Error message:', err.message);
        console.error('❌ Full error:', err);
        this.notificationService.error('Грешка при създаване на публикация: ' + (err.message || err.error?.message || 'Неизвестна грешка'));
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/my-requests']);
  }

  onRequiredFieldChange(event: any, field: string) {
    const current = this.requestForm.get('requiredFields')?.value || [];
    if (event.checked) {
      if (!current.includes(field)) {
        this.requestForm.get('requiredFields')?.setValue([...current, field]);
      }
    } else {
      this.requestForm.get('requiredFields')?.setValue(current.filter((f: string) => f !== field));
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CompanyRequest } from '../../model/companyRequest';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CompanyRequestService } from '../../service/company-request.service';
import { Company } from '../../model/company';
import { CompanyService } from '../../service/company.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';
import { Subject, takeUntil, filter } from 'rxjs';
import { FormatDateArrayPipe } from '../user-responses/format-date-array.pipe';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-user-requests',
  imports: [RouterOutlet, CommonModule, MatGridListModule, MatCardModule, MatButtonModule, MatIconModule, FormatDateArrayPipe, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatMomentDateModule, MatCheckboxModule, MatRadioModule],
  templateUrl: './user-requests.component.html',
  styleUrl: './user-requests.component.scss',
  standalone: true
})
export class UserRequestsComponent implements OnInit, OnDestroy {
    companyRequests: CompanyRequest[] = [];
    showCancelButton: boolean = false; 
    userCompanies: Company[] = [];
    private destroy$ = new Subject<void>();
    
    // Modal properties
    showCreateRequestModal = false;
    isSubmitting = false;
    filePreview: string | null = null;
    previewType = '';
    modalSelectedFiles: File[] = [];
    
    requestForm!: FormGroup;

  companyRequest: CompanyRequest = {
    id: '',
    title: '',
    description: '',
    requesterCompanyId: '',
    requesterName: '',
    pictures: [],
    requestType: '',
    status: '',
    availableFrom: new Date(),
    availableTo: new Date(),
    requiredFields: []
  };

  selectedFiles: File[] = [];

  pictureBlobs: { [key: string]: any } = {};
  selectedImage: any | null = null;
  showImageDialog: boolean = false;

  constructor(
    private router: Router,
    private companyRequestService: CompanyRequestService,
    private companyService: CompanyService,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    // this.loadRequests(); // Remove initial call from constructor
  }

  ngOnInit(): void {
    // Зареждаме user companies само веднъж
    this.companyService.getAllCompaniesByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.userCompanies = companies;
        },
        error: (err) => {
          console.error('Error loading user companies:', err);
          this.userCompanies = [];
        }
      });
    
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.showCancelButton = this.router.url.includes('/create');
        if (this.router.url.includes('/my-requests')) {
          this.loadRequests();
        }
      });
    
    this.loadRequests();
    
    this.initializeForm();
  }
  
  private initializeForm(): void {
    this.requestForm = this.fb.group({
      company: ['', Validators.required],
      region: ['', Validators.required],
      title: ['', Validators.required],
      requestType: ['', Validators.required],
      description: ['', Validators.required],
      activeFrom: [''],
      activeTo: [''],
      urgent: [false],
      serviceType: [''],
      capacity: [''],
      unit: [''],
      workMode: [''],
      priceFrom: [''],
      priceTo: [''],
      requiredFields: [[]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCompanyNameById(id: string): string {
    const company = this.userCompanies.find(c => String(c.id) === String(id));
    return company ? company.name +  ' (' + company.vatNumber + ')' : '';
  }

  loadRequests(): void {
    this.companyRequestService.getAllRequestsByUser().subscribe({
      next: (data: any[]) => {

        console.log('Received processed user requests data:', data);
        this.companyRequests = data.map(req => {
          if (!req) {
            console.warn('Found null/undefined request item');
            return null;
          }
          
          let activeFrom = req.activeFrom;
          let activeTo = req.activeTo;
          if (Array.isArray(activeFrom) && activeFrom.length >= 3) {
            activeFrom = new Date(activeFrom[0], activeFrom[1] - 1, activeFrom[2], activeFrom[3] || 0, activeFrom[4] || 0);
          } else if (typeof activeFrom === 'string' || typeof activeFrom === 'number') {
            activeFrom = new Date(activeFrom);
          }
          if (Array.isArray(activeTo) && activeTo.length >= 3) {
            activeTo = new Date(activeTo[0], activeTo[1] - 1, activeTo[2], activeTo[3] || 0, activeTo[4] || 0);
          } else if (typeof activeTo === 'string' || typeof activeTo === 'number') {
            activeTo = new Date(activeTo);
          }
          
          return {
            ...req,
            activeFrom,
            activeTo
          };
        }).filter(item => item !== null); 
        
        console.log('Processed company requests for display:', this.companyRequests);
      },
      error: (error: Error) => {
        console.error('Error fetching companies:', error);
      }
    });
  }

  viewRequestDetails(requestId: string): void {
    this.router.navigate(['/requests', requestId]);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      
      const previewUrls: string[] = [];
      
      if (!this.companyRequest.files) {
        this.companyRequest.files = [];
      }
      
      for (const file of this.selectedFiles) {
        const url = URL.createObjectURL(file);
        const isImage = file.type.startsWith('image/');
        
        this.companyRequest.files.push({
          url: url,
          isImage: isImage,
          name: file.name
        });
        
        if (isImage) {
          previewUrls.push(url);
        }
      }
      
      this.companyRequest.pictures = previewUrls;
    }
  }

  createRequest() {
    this.router.navigate(['/my-requests/create']);
  }
  
  onCancel() {
    this.router.navigate(['/my-requests']);
    
  }
  getGridColumns(): number {
    if (this.companyRequests.length === 1) {
      return 1; 
    } else if (this.companyRequests.length === 2) {
      return 2; 
    } else {
      return 3; 
    }
  }

  getRowHeight(): string {
    if (this.companyRequests.length === 1) {
      return '4:3'; 
    } else if (this.companyRequests.length === 2) {
      return '3:2'; 
    } else {
      return '2:1'; 
    }
  }

  getColSpan(): number {
    if (this.companyRequests.length === 1) {
      return 1; 
    } else {
      return 1; 
    }
  }

  getRowSpan(): number {
    if (this.companyRequests.length === 1) {
      return 2;
    } else if (this.companyRequests.length === 2) {
      return 2;
    } else {
      return 2; 
    }
  }

  getUnitLabel(unit: string): string {
    switch (unit) {
      case 'count': return 'Бр.';
      case 'box': return 'Кашон/и';
      case 'pallet': return 'Пале/та';
      default: return unit || '';
    }
  }

  loadAllPictures(): void {
    this.companyRequests.forEach(request => {
      const urls = (request as any).pictureUrls || [];
      if (Array.isArray(urls)) {
        urls.forEach((pic: string) => {
          if (pic && !this.pictureBlobs[pic]) {
            this.fetchPicture(pic);
          }
        });
      }
    });
  }

  fetchPicture(pic: string): void {
    const url = this.getPictureUrl(pic);
    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      const safeUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
      this.pictureBlobs[pic] = safeUrl;
    });
  }

  getPictureUrl(pic: string): string {
    if (!pic) return '';
    if (pic.startsWith('http')) {
      return pic;
    }
    return `${environment.apiUrl}/files/` + pic.replace(/\\/g, '/');
  }

  onImageClick(pic: string): void {
    this.selectedImage = this.pictureBlobs[pic] || this.getPictureUrl(pic);
    this.showImageDialog = true;
  }

  closeImageDialog(): void {
    this.showImageDialog = false;
    this.selectedImage = null;
  }

  getPictureUrls(request: any): string[] {
    return Array.isArray(request.pictureUrls) ? request.pictureUrls : [];
  }

  openCreateRequestModal(): void {
    this.showCreateRequestModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeCreateRequestModal(): void {
    this.showCreateRequestModal = false;
    document.body.style.overflow = 'auto';
    this.resetForm();
  }

  // // Debug метод за проверка на валидността на формата в модала
  // logModalFormStatus(): void {
  //   alert('MODAL DEBUG BUTTON CLICKED!');
  //   console.log('🔍 MODAL DEBUG BUTTON CLICKED!');
  //   console.log('📊 Modal Form valid:', this.requestForm.valid);
  //   console.log('📊 Modal Form invalid:', this.requestForm.invalid);
  //   console.log('📊 Modal Form errors:', this.requestForm.errors);
    
  //   Object.keys(this.requestForm.controls).forEach(key => {
  //     const control = this.requestForm.get(key);
  //     if (control && control.invalid) {
  //       console.log(`❌ Modal Field "${key}" is invalid:`, control.errors);
  //     } else if (control && control.valid) {
  //       console.log(`✅ Modal Field "${key}" is valid:`, control.value);
  //     }
  //   });
  // }

  private resetForm(): void {
    this.requestForm.reset({
      company: '',
      region: '',
      title: '',
      requestType: '',
      description: '',
      activeFrom: '',
      activeTo: '',
      urgent: false,
      serviceType: '',
      capacity: '',
      unit: '',
      workMode: '',
      priceFrom: '',
      priceTo: '',
      requiredFields: []
    });
    this.filePreview = null;
    this.previewType = '';
    this.modalSelectedFiles = [];
    
    const fileInput = document.getElementById('modalAttachment') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  selectFiles(): void {
    const fileInput = document.getElementById('modalAttachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onModalFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.addFilesToArray(newFiles);
      
      input.value = '';
    }
  }

  private addFilesToArray(newFiles: File[]): void {
    const maxFileSize = 25 * 1024 * 1024; // 25MB в байтове
    
    newFiles.forEach(newFile => {
      if (newFile.size > maxFileSize) {
        alert(`Файлът "${newFile.name}" е твърде голям (${(newFile.size / (1024 * 1024)).toFixed(2)}MB). Максималният размер е 25MB.`);
        console.warn('Modal file too large:', newFile.name, `${(newFile.size / (1024 * 1024)).toFixed(2)}MB`);
        return; 
      }
      
      if (!newFile.type.startsWith('image/') && newFile.type !== 'application/pdf') {
        alert('Неподдържан тип файл: ' + newFile.name + '. Моля, използвайте само изображения или PDF файлове.');
        console.warn('Unsupported file type ignored in modal:', newFile.type);
        return; 
      }
      
      const isDuplicate = this.modalSelectedFiles.some(existingFile => 
        existingFile.name === newFile.name && 
        existingFile.size === newFile.size &&
        existingFile.lastModified === newFile.lastModified
      );
      
      if (!isDuplicate) {
        this.modalSelectedFiles.push(newFile);
        console.log('Modal file added:', newFile.name, `${(newFile.size / (1024 * 1024)).toFixed(2)}MB`);
      } else {
        console.warn('Modal file already selected, skipping:', newFile.name);
      }
    });
    
    this.updateFilePreview();
  }

  private updateFilePreview(): void {
    const firstImageFile = this.modalSelectedFiles.find(file => file.type.startsWith('image/'));
    if (firstImageFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreview = e.target.result;
        this.previewType = 'image';
      };
      reader.readAsDataURL(firstImageFile);
    } else if (this.modalSelectedFiles.length > 0) {
      const firstFile = this.modalSelectedFiles[0];
      if (firstFile.type === 'application/pdf') {
        this.previewType = 'pdf';
      } else {
        this.previewType = 'file';
      }
      this.filePreview = 'preview';
    } else {
      this.filePreview = null;
      this.previewType = '';
    }
  }

  onSubmitRequest(): void {
    console.log('🎯 Modal onSubmitRequest called');
    
    if (this.requestForm.valid && !this.isSubmitting) {
      console.log('✅ Modal form is valid, proceeding...');
      
      const maxFileSize = 25 * 1024 * 1024; 
      const oversizedFiles = this.modalSelectedFiles.filter(file => file.size > maxFileSize);
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(f => `${f.name} (${(f.size / (1024 * 1024)).toFixed(2)}MB)`).join(', ');
        alert(`Следните файлове са твърде големи: ${fileNames}. Максималният размер е 25MB на файл.`);
        return;
      }
      
      this.isSubmitting = true;
      
      const formData = new FormData();
      const formValue = this.requestForm.value;
      console.log('📝 Modal form values:', formValue);
      
      const selectedCompany = this.userCompanies.find(c => c.vatNumber === formValue.company);
      console.log('🏢 Modal selected company:', selectedCompany);
      
      if (selectedCompany) {
        console.log('✅ Company found in modal, preparing request data...');
        
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
          urgent: formValue.urgent || false,
          serviceType: formValue.serviceType || '',
          capacity: formValue.capacity || '',
          workMode: formValue.workMode || '',
          priceFrom: formValue.priceFrom || '',
          priceTo: formValue.priceTo || '',
          unit: formValue.unit || '',
          requiredFields: formValue.requiredFields || []
        };
        
        console.log('📋 Modal request data prepared:', requestCompany);
        formData.append('requestCompany', new Blob([JSON.stringify(requestCompany)], { type: 'application/json' }));
        
        if (this.modalSelectedFiles.length > 0) {
          console.log(`📎 Adding ${this.modalSelectedFiles.length} files from modal:`);
          this.modalSelectedFiles.forEach((file, index) => {
            console.log(`File ${index + 1}: ${file.name} (${file.type}, ${file.size} bytes)`);
            formData.append('files', file, file.name);
          });
        } else {
          console.log('📎 No files attached in modal');
        }
        
        console.log('🌐 Modal calling companyRequestService.createRequest...');
        
        this.companyRequestService.createRequest(formData).subscribe({
          next: (response) => {
            console.log('✅ Modal request created successfully:', response);
            this.isSubmitting = false;
            this.closeCreateRequestModal();
            this.loadRequests(); // Reload the requests list
          },
          error: (err) => {
            console.error('❌ Modal error creating request:', err);
            this.isSubmitting = false;
            alert('Грешка при създаване на публикация: ' + (err.message || err.error?.message || 'Неизвестна грешка'));
          }
        });
      } else {
        console.error('❌ No company selected in modal!');
        this.isSubmitting = false;
        alert('Моля, изберете фирма!');
      }
    } else {
      console.log('❌ Modal form is invalid or already submitting');
      if (this.requestForm.invalid) {
        console.log('Modal form errors:', this.requestForm.errors);
        Object.keys(this.requestForm.controls).forEach(key => {
          const control = this.requestForm.get(key);
          if (control && control.invalid) {
            console.log(`❌ Modal field "${key}" is invalid:`, control.errors);
          }
        });
      }
    }
  }

  removeFile(index: number): void {
    this.modalSelectedFiles.splice(index, 1);
    
    if (this.modalSelectedFiles.length === 0) {
      this.filePreview = null;
      this.previewType = '';
      const fileInput = document.getElementById('modalAttachment') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      this.updateFilePreview();
    }
  }
}

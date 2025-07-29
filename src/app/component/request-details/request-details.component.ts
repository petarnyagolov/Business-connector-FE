import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CompanyRequestService } from '../../service/company-request.service';
import { CompanyRequest } from '../../model/companyRequest';
import { CompanyService } from '../../service/company.service';
import { Company } from '../../model/company';
import { ResponseService } from '../../service/response.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { EmailVerificationService } from '../../service/email-verification.service';
import { ResponseDialogComponent } from './response-dialog.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatDialogModule
  ],
  templateUrl: './request-details.component.html',
  styleUrls: ['./request-details.component.scss']
})
export class RequestDetailsComponent implements OnInit, OnDestroy {
  request: CompanyRequest | null = null;
  responses: any[] = [];
  userCompanies: Company[] = [];
  requesterCompany: Company | null = null;
  editResponseData: any = {};
  editResponseItem: any = null;
  showEditResponseDialog: boolean = false;
  
  showImageDialog: boolean = false;
  selectedImage: string | null = null;
  currentImageIndex: number = 0;
  imageFiles: { url: string, name: string }[] = [];
  
  selectedPdfUrl: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private companyRequestService: CompanyRequestService,
    private companyService: CompanyService,
    private responseService: ResponseService,
    private fb: FormBuilder,
    private authService: AuthService,
    private emailVerificationService: EmailVerificationService,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {
    this.loadUserCompanies();
  }

  loadUserCompanies(): void {
    this.companyService.getAllCompaniesByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.userCompanies = companies;
          console.log('Loaded companies:', this.userCompanies);
        },
        error: (error) => {
          console.error('Error loading user companies:', error);
          this.userCompanies = [];
        }
      });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.companyRequestService.getRequestById(id).subscribe(res => {
        this.request = res.request;
        this.responses = res.responses || [];
        
        this.initializeImageFiles();
        
        if (this.request?.requesterCompanyId) {
          this.requesterCompany = this.userCompanies.find(
            company => company.id === this.request?.requesterCompanyId
          ) || null;
          
          if (!this.requesterCompany) {
            console.log('Requester company not found in user companies list');
          }
        }
      });
    }
  }

  private processResponseSubmission(formData: any): void {
    if (!this.request) return;
    
    console.log('Processing response submission with data:', formData);
    
    const dto: any = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'files') {
        if (key === 'message') {
          dto['responseText'] = formData.message;
        } else {
          dto[key] = formData[key];
        }
      }
    });
    
    const files: File[] = [];
    if (formData.files && formData.files.length > 0) {
      console.log('Files received in formData:', formData.files);
      
      if (Array.isArray(formData.files)) {
        console.log('formData.files is an array with length:', formData.files.length);
        files.push(...formData.files);
      } else if (formData.files instanceof FileList) {
        console.log('formData.files is a FileList with length:', formData.files.length);
        for (let i = 0; i < formData.files.length; i++) {
          files.push(formData.files[i]);
        }
      } else {
        console.log('formData.files is a single File object');
        files.push(formData.files);
      }
      
      console.log('Files to be submitted:', files.length, 'files');
      console.log('Files details:', files.map(f => `${f.name} (${f.type}, ${f.size} bytes)`).join(', '));
    } else {
      console.log('No files to submit');
    }
    
    console.log('Sending response with DTO:', dto, 'and files:', files);
    this.responseService.createResponse(this.request!.id, dto, files).subscribe({
      next: () => {
        this.loadResponses();
      },
      error: (error) => {
        console.error('Error submitting response:', error);
        alert('Възникна грешка при изпращането на предложението.');
      }
    });
  }

  getFieldLabel(field: string): string {
    switch (field) {
      case 'fixedPrice': return 'Фиксирана цена';
      case 'priceFrom': return 'Цена от';
      case 'priceTo': return 'Цена до';
      case 'availableFrom': return 'Налично от';
      case 'availableTo': return 'Налично до';
      case 'picture': return 'Снимка';
      default: return field;
    }
  }

  editResponse(resp: any) {
    this.editResponseItem = resp;
    this.editResponseData = {
      responseText: resp.responseText,
      responserCompanyId: resp.responserCompanyId,
      id: resp.id
    };
    this.showEditResponseDialog = true;
  }

  closeEditResponseDialog() {
    this.showEditResponseDialog = false;
    this.editResponseData = {};
    this.editResponseItem = null;
  }

  submitEditResponse() {
    if (!this.editResponseItem) return;
    const requestCompanyId = this.request?.id;
    const dto = {
      id: this.editResponseData.id,
      responseText: this.editResponseData.responseText,
      responserCompanyId: this.editResponseData.responserCompanyId
    };
    this.responseService.updateResponse(requestCompanyId!, dto).subscribe({
      next: () => {
        this.editResponseItem.responseText = dto.responseText;
        this.editResponseItem.responserCompanyId = dto.responserCompanyId;
        this.closeEditResponseDialog();
      },
      error: () => {
        alert('Грешка при редакция на предложение!');
      }
    });
  }

  formatDateArray(date: any): string {
    if (!date) return '';
    if (Array.isArray(date) && date.length >= 3) {
      const d = new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0);
      return d.toLocaleDateString('bg-BG');
    }
    if (typeof date === 'string' || typeof date === 'number') {
      const d = new Date(date);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('bg-BG');
    }
    return '';
  }

  getCompanyName(id: string): string {
    const company = this.userCompanies.find(c => String(c.id) === String(id));
    return company ? company.name + (company.vatNumber ? ' (' + company.vatNumber + ')' : '') : id || '';
  }

  canEditResponse(resp: any): boolean {
    return !!resp.responserCompanyId && this.userCompanies.some(c => c.id === resp.responserCompanyId);
  }

  getAvailableCompaniesForResponse(): Company[] {
    if (!this.responses || !this.userCompanies) return this.userCompanies || [];

    const companiesWithResponses = this.responses
      .map(response => response.responserCompanyId)
      .filter(id => id); 

    return this.userCompanies.filter(company => !companiesWithResponses.includes(company.id));
  }

  hasAvailableCompaniesForResponse(): boolean {
    const availableCompanies = this.getAvailableCompaniesForResponse();
    return availableCompanies.length > 0;
  }

  getUnitLabel(unit: string): string {
    switch (unit) {
      case 'count': return 'Бр.';
      case 'box': return 'Кашон/и';
      case 'pallet': return 'Пале/та';
      default: return unit || '';
    }
  }

  openResponseModal(): void {
    console.log('Opening response dialog, companies:', this.userCompanies);
    
    if (!this.hasAvailableCompaniesForResponse()) {
      const availableCompanies = this.getAvailableCompaniesForResponse();
      if (availableCompanies.length === 0 && this.userCompanies.length > 0) {
        alert('Всички ваши фирми вече са направили предложения към тази публикация. Можете да редактирате.');
      } else {
        alert('Нямате регистрирани фирми за правене на предложение.');
      }
      return;
    }
    
    this.emailVerificationService.checkVerificationOrPrompt().subscribe((canProceed: boolean) => {
      if (!canProceed) {
        return;
      }
      
      console.log('Request required fields:', this.request?.requiredFields);
      
      const dialogRef = this.dialog.open(ResponseDialogComponent, {
        width: '500px',
        data: {
          requestId: this.request?.id,
          requiredFields: this.request?.requiredFields || [],
          availableCompanies: this.getAvailableCompaniesForResponse() 
        }
      });
      
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.processResponseSubmission(result);
        }
      });
    });
  }

  loadResponses(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.request) {
      this.companyRequestService.getRequestById(id).subscribe(res => {
        this.responses = res.responses || [];
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  initializeImageFiles(): void {
    if (this.request && this.request.files) {
      this.imageFiles = this.request.files
        .filter(file => file.isImage)
        .map(file => ({ url: file.url, name: file.name }));
      
      if (this.imageFiles.length === 0 && this.request.pictures && this.request.pictures.length) {
        this.imageFiles = this.request.pictures.map(pic => ({ 
          url: pic, 
          name: pic.split('/').pop() || 'Image' 
        }));
      }
    }
  }
  
  openImageModal(imageUrl: string): void {
    if (this.imageFiles.length === 0) {
      this.initializeImageFiles();
    }
    
    this.currentImageIndex = this.imageFiles.findIndex(img => img.url === imageUrl);
    if (this.currentImageIndex < 0) this.currentImageIndex = 0;
    
    this.selectedImage = imageUrl;
    this.showImageDialog = true;
    
    document.addEventListener('keydown', this.handleKeydown);
  }
  
  closeImageDialog(): void {
    this.showImageDialog = false;
    this.selectedImage = null;
    
    document.removeEventListener('keydown', this.handleKeydown);
  }
  
  handleKeydown = (event: KeyboardEvent): void => {
    if (this.showImageDialog) {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        this.nextImage();
        event.preventDefault();
      } else if (event.key === 'ArrowLeft') {
        this.previousImage();
        event.preventDefault();
      } else if (event.key === 'Escape') {
        this.closeImageDialog();
        event.preventDefault();
      }
    }
  }
  
  nextImage(): void {
    if (this.imageFiles.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.imageFiles.length;
      this.selectedImage = this.imageFiles[this.currentImageIndex].url;
    }
  }
  
  previousImage(): void {
    if (this.imageFiles.length > 1) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.imageFiles.length) % this.imageFiles.length;
      this.selectedImage = this.imageFiles[this.currentImageIndex].url;
    }
  }
  
  openPdfInNewTab(pdfUrl: string): void {
    window.open(pdfUrl, '_blank');
  }
}

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { EmailVerificationService } from '../../service/email-verification.service';
import { ResponseDialogComponent } from './response-dialog.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

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
  
  pictureBlobs: { [key: string]: any } = {};
  
  showDealDialog: boolean = false;
  dealFormData = {
    confirmDeal: false,
    hidePublication: false,
    startChat: false
  };
  selectedResponse: any = null;
  
  showSuccessModal: boolean = false;
  successModalData = {
    title: '',
    message: '',
    buttonText: 'ОК'
  };
  
  showConfirmModal: boolean = false;
  confirmModalData = {
    title: '',
    message: '',
    confirmText: 'Да',
    cancelText: 'Не'
  };
  pendingDeleteResponse: any = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private companyRequestService: CompanyRequestService,
    private companyService: CompanyService,
    private responseService: ResponseService,
    private emailVerificationService: EmailVerificationService,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
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
        this.request = this.processRequestFileUrls(res.request);
        this.responses = this.processResponsesFileUrls(res.responses || []);
        
        this.initializeImageFiles();
        this.loadAllPictures();
        
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

  processRequestFileUrls(request: any): any {
    if (!request.files && request.fileUrls && Array.isArray(request.fileUrls)) {
      request.files = request.fileUrls.map((fileUrl: string) => {
        const url = this.getFileUrl(fileUrl);
        
        const fileName = fileUrl.split('\\').pop()?.split('/').pop() || 'file';
        
        const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt);
        
        return {
          url,
          isImage,
          name: fileName
        };
      });
    }
    return request;
  }

  processResponsesFileUrls(responses: any[]): any[] {
    return responses.map(response => {
      if (!response.files && response.fileUrls && Array.isArray(response.fileUrls)) {
        response.files = response.fileUrls.map((fileUrl: string) => {
          const url = this.getFileUrl(fileUrl);
          const fileName = fileUrl.split('\\').pop()?.split('/').pop() || 'file';
          
          const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt);
          
          return {
            url,
            isImage,
            name: fileName
          };
        });
      }
      return response;
    });
  }

  loadAllPictures(): void {
    if (this.request) {
      const urls = this.getPictureUrls(this.request);
      if (Array.isArray(urls)) {
        urls.forEach((pic: string) => {
          if (pic && !this.pictureBlobs[pic]) {
            this.fetchPicture(pic);
          }
        });
      }
    }
    
    this.responses.forEach(response => {
      if (response.files && Array.isArray(response.files)) {
        response.files.forEach((file: any) => {
          if (file.isImage && file.url && !this.pictureBlobs[file.url]) {
            this.fetchPicture(file.url);
          }
        });
      }
    });
  }

  fetchPicture(pic: string): void {
    const url = this.getPictureUrl(pic);
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: blob => {
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
        this.pictureBlobs[pic] = safeUrl;
      },
      error: error => {
        console.error('Error loading image:', pic, error);
      }
    });
  }

  getPictureUrls(request: any): string[] {
    if (Array.isArray(request.files)) {
      const imageFiles = request.files.filter((file: any) => file.isImage);
      if (imageFiles.length > 0) {
        return imageFiles.map((file: any) => file.url);
      }
    }
    
    const pictureUrls = Array.isArray(request.pictureUrls) ? request.pictureUrls : [];
    const pictures = Array.isArray(request.pictures) ? request.pictures : [];
    
    return [...new Set([...pictureUrls, ...pictures])];
  }

  getPictureUrl(pic: string): string {
    return this.getFileUrl(pic);
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
        this.showSuccessMessage('Грешка', 'Възникна грешка при изпращането на предложението.', 'ОК');
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
      id: resp.id,
      responserCompanyId: resp.responserCompanyId,
      originalResponseText: resp.responseText, 
      responseText: resp.responseText,
      additionalText: '', 
      fixedPrice: resp.fixedPrice,
      priceFrom: resp.priceFrom,
      priceTo: resp.priceTo,
      availableFrom: resp.availableFrom,
      availableTo: resp.availableTo,
      files: resp.files || []
    };
    this.showEditResponseDialog = true;
  }

  closeEditResponseDialog() {
    this.showEditResponseDialog = false;
    this.editResponseData = {};
    this.editResponseItem = null;
  }

  submitEditResponse() {
    if (!this.editResponseItem || !this.editResponseData.additionalText?.trim()) {
      this.showSuccessMessage('Внимание', 'Моля, въведете текст за добавяне към предложението.', 'ОК');
      return;
    }
    
    console.log('Submitting edit with additional text:', this.editResponseData.additionalText);
    
    this.responseService.updateResponseText(this.editResponseData.id, this.editResponseData.additionalText).subscribe({
      next: (updatedResponse: any) => {
        console.log('Response updated successfully:', updatedResponse);
        
        const responseIndex = this.responses.findIndex(r => r.id === this.editResponseData.id);
        if (responseIndex !== -1) {
          this.responses[responseIndex] = { 
            ...this.responses[responseIndex], 
            responseText: updatedResponse.responseText || this.responses[responseIndex].responseText 
          };
        }
        
        if (this.editResponseItem) {
          this.editResponseItem.responseText = updatedResponse.responseText || this.editResponseItem.responseText;
        }
        
        this.closeEditResponseDialog();
        
        this.loadResponses();
      },
      error: (error: any) => {
        console.error('Error updating response:', error);
        this.showSuccessMessage(
          'Грешка',
          'Грешка при обновяване на предложението! Моля, опитайте отново.',
          'Затвори'
        );
      }
    });
  }

  deleteResponse(resp: any) {
    if (!resp || !resp.id) return;
    
    this.pendingDeleteResponse = resp;
    this.confirmModalData = {
      title: 'Потвърждение за изтриване',
      message: 'Сигурен ли си че искаш да премахнеш предложението завинаги?',
      confirmText: 'Изтрий',
      cancelText: 'Отказ'
    };
    this.showConfirmModal = true;
  }

  executeDeleteResponse(resp: any): void {
    console.log('🗑️ Starting executeDeleteResponse for response:', resp.id);
    console.log('📊 Current responses count:', this.responses.length);
    console.log('📋 Current responses:', this.responses.map(r => ({id: r.id, status: r.status, text: r.responseText?.substring(0, 30)})));
    
    this.responseService.deleteResponse(resp.id).subscribe({
      next: () => {
        console.log('✅ Response deleted successfully on backend:', resp.id);
        
        const responseIndex = this.responses.findIndex(r => r.id === resp.id);
        if (responseIndex !== -1) {
          console.log('🔄 Updating response status to NOT_AVAILABLE for response:', resp.id);
          this.responses[responseIndex].status = 'NOT_AVAILABLE';
          
          console.log('✅ Response status updated locally');
          console.log('📋 Updated response:', {id: this.responses[responseIndex].id, status: this.responses[responseIndex].status});
        } else {
          console.warn('⚠️ Response not found in local array:', resp.id);
        }
        
        console.log('⚡ Forcing change detection with ChangeDetectorRef...');
        this.cdr.detectChanges();
        console.log('✅ Change detection completed');
        
        this.showSuccessMessage(
          'Успех! ✅',
          'Предложението е оттеглено успешно!',
          'Отлично'
        );
      },
      error: (error: any) => {
        console.error('❌ Error deleting response:', error);
        this.showSuccessMessage(
          'Грешка',
          'Грешка при оттегляне на предложението! Моля, опитайте отново.',
          'Затвори'
        );
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

  canMakeDeal(resp: any): boolean {
    return !!this.request?.requesterCompanyId && 
           this.userCompanies.some(c => c.id === this.request?.requesterCompanyId);
  }

  openDealDialog(response: any): void {
    this.selectedResponse = response;
    this.dealFormData = {
      confirmDeal: false,
      hidePublication: false,
      startChat: false
    };
    this.showDealDialog = true;
  }

  closeDealDialog(): void {
    this.showDealDialog = false;
    this.selectedResponse = null;
    this.dealFormData = {
      confirmDeal: false,
      hidePublication: false,
      startChat: false
    };
  }

  showSuccessMessage(title: string, message: string, buttonText: string = 'ОК'): void {
    this.successModalData = { title, message, buttonText };
    this.showSuccessModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  showConfirmMessage(title: string, message: string, confirmText: string = 'Да', cancelText: string = 'Не'): Promise<boolean> {
    this.confirmModalData = { title, message, confirmText, cancelText };
    this.showConfirmModal = true;
    
    return new Promise<boolean>((resolve) => {
      const checkClosed = () => {
        if (!this.showConfirmModal) {
          resolve(this.confirmModalData.confirmText === 'CONFIRMED');
        } else {
          setTimeout(checkClosed, 100);
        }
      };
      checkClosed();
    });
  }

  closeConfirmModal(confirmed: boolean = false): void {
    this.confirmModalData.confirmText = confirmed ? 'CONFIRMED' : this.confirmModalData.confirmText;
    this.showConfirmModal = false;
  }

  confirmAction(): void {
    this.closeConfirmModal(true);
    if (this.pendingDeleteResponse) {
      this.executeDeleteResponse(this.pendingDeleteResponse);
      this.pendingDeleteResponse = null;
    }
  }

  canSubmitDeal(): boolean {
    return this.dealFormData.confirmDeal && 
           this.dealFormData.hidePublication && 
           this.dealFormData.startChat;
  }

  submitDeal(): void {
    if (!this.canSubmitDeal() || !this.selectedResponse) {
      this.showSuccessMessage(
        'Внимание', 
        'Моля, отбележете всички полета за потвърждение!',
        'Разбрах'
      );
      return;
    }

    const dealData = {
      id: this.selectedResponse.id,
      responseText: this.selectedResponse.responseText,
      responserCompanyId: this.selectedResponse.responserCompanyId,
      fixedPrice: this.selectedResponse.fixedPrice,
      priceFrom: this.selectedResponse.priceFrom,
      priceTo: this.selectedResponse.priceTo,
      fileUrls: this.selectedResponse.fileUrls || [],
      requestCompany: this.request,
      availableTo: this.selectedResponse.availableTo,
      availableFrom: this.selectedResponse.availableFrom
    };

    console.log('Submitting deal confirmation:', dealData);

    this.responseService.confirmDeal(dealData).subscribe({
      next: (response) => {
        console.log('Deal confirmed successfully:', response);
        this.closeDealDialog();
        this.showSuccessMessage(
          'Успех! 🎉',
          'Сделката е потвърдена успешно! Публикацията е скрита и чат сесията е започната.',
          'Отлично'
        );
      },
      error: (error) => {
        console.error('Error confirming deal:', error);
        this.showSuccessMessage(
          'Грешка',
          'Възникна грешка при потвърждаване на сделката! Моля, опитайте отново.',
          'Затвори'
        );
      }
    });
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
        this.showSuccessMessage(
          'Информация',
          'Всички ваши фирми вече са направили предложения към тази публикация. Можете да редактирате.',
          'Разбрах'
        );
      } else {
        this.showSuccessMessage(
          'Внимание',
          'Нямате регистрирани фирми за правене на предложение.',
          'Разбрах'
        );
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
  
  initializeImageFilesForItem(item: any): void {
    this.imageFiles = [];
    
    if (item.files && item.files.length) {
      const imageFiles = item.files
        .filter((file: {isImage: boolean}) => file.isImage)
        .map((file: {url: string, name: string}) => ({
          url: file.url,
          name: file.name
        }));
      this.imageFiles.push(...imageFiles);
      
      if (this.imageFiles.length > 0) {
        console.log(`Инициализирани ${this.imageFiles.length} изображения от files за предложение/заявка`);
        return;
      }
    }
    
    if (!item.files || item.files.length === 0 || 
        !item.files.some((file: {isImage: boolean}) => file.isImage)) {
      
      const pictureUrls = Array.isArray(item.pictureUrls) ? 
                        item.pictureUrls : 
                        (Array.isArray(item.pictures) ? item.pictures : []);
                        
      if (pictureUrls && pictureUrls.length) {
        pictureUrls.forEach((pic: string) => {
          const url = this.pictureBlobs[pic] || this.getPictureUrl(pic);
          const name = pic.split('/').pop() || pic;
          this.imageFiles.push({ url, name });
        });
        console.log(`Инициализирани ${this.imageFiles.length} изображения от pictureUrls за предложение/заявка`);
      }
    }
    
    if ((!item.files || item.files.length === 0) && 
        item.fileUrls && Array.isArray(item.fileUrls)) {
      item.fileUrls.forEach((fileUrl: string) => {
        if (this.isImageFile(fileUrl)) {
          const url = this.getFileUrl(fileUrl);
          const name = this.getFileName(fileUrl);
          this.imageFiles.push({ url, name });
        }
      });
    }
    
    const uniqueUrls = new Set<string>();
    this.imageFiles = this.imageFiles.filter(img => {
      if (uniqueUrls.has(img.url)) {
        return false;
      }
      uniqueUrls.add(img.url);
      return true;
    });
    
    console.log(`Общо ${this.imageFiles.length} уникални изображения за това предложение/заявка`);
  }

  initializeImageFiles(): void {
    this.imageFiles = [];
    
    if (this.request) {
      if (this.request.files && this.request.files.length) {
        const imageFiles = this.request.files
          .filter((file: {isImage: boolean}) => file.isImage)
          .map((file: {url: string, name: string}) => ({
            url: file.url,
            name: file.name
          }));
        this.imageFiles.push(...imageFiles);
      }
      
      if (!this.request.files || this.request.files.length === 0 || 
          !this.request.files.some((file: {isImage: boolean}) => file.isImage)) {
        
        const pictureUrls = Array.isArray(this.request.pictureUrls) ? 
                          this.request.pictureUrls : 
                          (Array.isArray(this.request.pictures) ? this.request.pictures : []);
                          
        if (pictureUrls && pictureUrls.length) {
          pictureUrls.forEach((pic: string) => {
            const url = this.pictureBlobs[pic] || this.getPictureUrl(pic);
            const name = pic.split('/').pop() || pic;
            this.imageFiles.push({ url, name });
          });
        }
      }
    }
    
    this.responses.forEach(response => {
      if (response.files && response.files.length) {
        const imageFiles = response.files
          .filter((file: {isImage: boolean}) => file.isImage)
          .map((file: {url: string, name: string}) => ({
            url: file.url,
            name: file.name
          }));
        this.imageFiles.push(...imageFiles);
      }
      
      if ((!response.files || response.files.length === 0) && 
          response.fileUrls && Array.isArray(response.fileUrls)) {
        response.fileUrls.forEach((fileUrl: string) => {
          if (this.isImageFile(fileUrl)) {
            const url = this.getFileUrl(fileUrl);
            const name = this.getFileName(fileUrl);
            this.imageFiles.push({ url, name });
          }
        });
      }
    });
    
    // Премахваме дубликати
    const uniqueUrls = new Set<string>();
    this.imageFiles = this.imageFiles.filter(img => {
      if (uniqueUrls.has(img.url)) {
        return false;
      }
      uniqueUrls.add(img.url);
      return true;
    });
    
    console.log(`Инициализирани ${this.imageFiles.length} уникални изображения`);
  }
  
  openImageModal(imageUrl: string, item?: any): void {
    if (item) {
      this.initializeImageFilesForItem(item);
    }
    else if (this.imageFiles.length === 0) {
      this.initializeImageFiles();
    }
    
    this.currentImageIndex = this.imageFiles.findIndex(img => {
      return img.url === imageUrl || 
             (typeof img.url === 'string' && typeof imageUrl === 'string' && 
              img.url.includes(imageUrl.split('/').pop() || '') || 
              imageUrl.includes(img.url.split('/').pop() || ''));
    });
    
    if (this.currentImageIndex < 0) {
      this.currentImageIndex = 0;
    }
    
    this.selectedImage = this.currentImageIndex >= 0 ? 
                        this.imageFiles[this.currentImageIndex].url : 
                        imageUrl;
    
    this.showImageDialog = true;
    
    document.addEventListener('keydown', this.handleKeydown);
  }

  openImageModalFromFileUrl(imageUrl: string, item: any): void {
    this.openImageModal(imageUrl, item);
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

  isImageFile(fileUrl: string): boolean {
    if (!fileUrl) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const fileName = fileUrl.toLowerCase();
    return imageExtensions.some(ext => fileName.includes(ext));
  }

  getFileUrl(fileUrl: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    // Normalize slashes and remove leading slashes
    let cleanPath = fileUrl.replace(/\\/g, '/').replace(/^\/+/, '');
    
    // Remove 'files/' prefix if present to avoid duplication
    if (cleanPath.startsWith('files/')) {
      cleanPath = cleanPath.substring(6);
    }
    
    // Always construct with single /files/ prefix
    const url = `${environment.apiUrl}/files/${cleanPath}`;
    
    console.log('getFileUrl:', { in: fileUrl, out: url });
    return url;
  }

  getFileName(fileUrl: string): string {
    if (!fileUrl) return 'Файл';
    const parts = fileUrl.split(/[/\\]/);
    const fileName = parts[parts.length - 1];
    const guidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
    return fileName.replace(guidPattern, '').replace(/^[_.-]+/, '') || 'Файл';
  }
}

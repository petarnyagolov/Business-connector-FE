import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCardModule, MatCardContent } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ResponseService } from '../../service/response.service';
import { CompanyService } from '../../service/company.service';
import { FormatDateArrayPipe } from './format-date-array.pipe';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ChatServiceNative as ChatService } from '../../service/chat-native.service';

@Component({
  selector: 'app-user-responses',
  imports: [CommonModule, MatIcon, MatCardModule, MatCardContent, MatButtonModule, FormatDateArrayPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, FormsModule],
  templateUrl: './user-responses.component.html',
  styleUrl: './user-responses.component.scss',
  standalone: true
})
export class UserResponsesComponent implements OnInit {
  userResponses: any[] = [];
  companies: any[] = [];
  pictureBlobs: { [key: string]: SafeUrl } = {};
  selectedImage: SafeUrl | null = null;
  showImageDialog: boolean = false;
  showEditResponseDialog = false;
  editResponseData: any = {};
  editResponseItem: any = null;
  editResponseRequiredFields: string[] = [];

  showConfirmModal = false;
  showSuccessModal = false;
  confirmModalData: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
  } = { title: '', message: '', confirmText: '', cancelText: '' };
  successModalData: {
    title: string;
    message: string;
    buttonText: string;
  } = { title: '', message: '', buttonText: '' };
  pendingDeleteItem: any = null;

  constructor(
    private responseService: ResponseService,
    private companyService: CompanyService,
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.responseService.getResponsesByUser().subscribe({
      next: (data) => {
        this.userResponses = data;
        this.loadCompanies();
        this.loadAllPictures();
      },
      error: () => {
        this.userResponses = [];
      }
    });
  }

  loadCompanies(): void {
    this.companyService.getAllCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
      },
      error: () => {
        this.companies = [];
      }
    });
  }

  loadAllPictures(): void {
    this.userResponses.forEach(item => {
      const urls = item.requestCompany?.pictureUrls || [];
      urls.forEach((pic: string) => {
        if (pic && !this.pictureBlobs[pic]) {
          this.fetchPicture(pic);
        }
      });
    });
  }

  fetchPicture(pic: string): void {
    const url = this.getPictureUrl(pic);
    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      const safeUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
      this.pictureBlobs[pic] = safeUrl;
    });
  }


  getCompanyName(companyId: string): string {
    const company = this.companies.find(c => c.id === companyId);
    return company ? company.name : '';
  }

  getCompanyVat(companyId: string): string {
    const company = this.companies.find(c => c.id === companyId);
    return company ? company.vatNumber : '';
  }

  getRequestTypeLabel(type: string): string {
    switch (type) {
      case 'LOOKING_FOR_SERVICE': return 'Търся услуга';
      case 'SHARE_SERVICE': return 'Предлагам услуга';
      case 'BUY': return 'Купувам';
      case 'SELL': return 'Продавам';
      case 'OTHER': return 'Друго';
      default: return type || '';
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
  getServiceTypeLabel(type: string): string {
    switch (type) {
      case 'one_time': return 'Еднократна';
      case 'permanent': return 'Постоянна';
      default: return type || '';
    }
  }
  getWorkModeLabel(mode: string): string {
    switch (mode) {
      case 'standard': return 'Стандартно делнично';
      case 'extended': return 'Удължено';
      case 'continuous': return 'Непрекъснато';
      case 'nomatter': return 'Без значение';
      default: return mode || '';
    }
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'DEAL': return 'СДЕЛКА';
      case 'ACTIVE': return 'АКТИВНА';
      case 'CLOSED': return 'ПРИКЛЮЧЕНА';
      default: return status || '';
    }
  }
  
  getPictureUrl(pic: string): string {
    if (!pic) return '';
    if (pic.startsWith('http')) {
      return pic;
    }
    // Премахваме files/ или /files/ префикс за да избегнем дублиране
    let cleanPath = pic.replace(/\\/g, '/');
    cleanPath = cleanPath.replace(/^\/+/, '');
    if (cleanPath.startsWith('files/')) {
      cleanPath = cleanPath.substring(6);
    }
    return `${environment.apiUrl}/files/${cleanPath}`;
  }

  onImageClick(pic: string): void {
    this.selectedImage = this.pictureBlobs[pic] || this.getPictureUrl(pic);
    this.showImageDialog = true;
    // Предотвратява скролването на фоновата страница
    document.body.style.overflow = 'hidden';
  }

  closeImageDialog(): void {
    this.showImageDialog = false;
    this.selectedImage = null;
    document.body.style.overflow = '';
  }

  openEditResponse(item: any) {
    this.editResponseItem = item;
    this.editResponseData = {
      oldResponseText: item.responseText || '',
      newResponseText: '',
      responserCompanyId: item.responserCompanyId,
      id: item.id, 
      date: item.date ? this.parseDateForPicker(item.date) : null 
    };
    this.editResponseRequiredFields = item.requestCompany?.requiredFields || [];
    for (const field of this.editResponseRequiredFields) {
      if (item[field] !== undefined) {
        this.editResponseData[field] = item[field];
      }
    }
    this.showEditResponseDialog = true;
    document.body.style.overflow = 'hidden';
  }

  parseDateForPicker(dateStr: string): Date | null {
    return dateStr ? new Date(dateStr) : null;
  }

  closeEditResponseDialog() {
    this.showEditResponseDialog = false;
    this.editResponseData = {};
    this.editResponseItem = null;
    document.body.style.overflow = '';
  }

  submitEditResponse() {
    if (!this.editResponseData.newResponseText || this.editResponseData.newResponseText.trim() === '') {
      this.showSuccessMessage('Внимание', 'Моля, въведете нов текст към предложението!', 'ОК');
      return;
    }
    if (!this.editResponseItem) return;
    
    // Форматираме датата: "14.1.2026 12:36:"
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timestamp = `${day}.${month}.${year} ${hours}:${minutes}:`;
    
    // Добавяме празен ред преди timestamp, после timestamp на нов ред и новия текст на нов ред
    const formattedText = `\n\n${timestamp}\n${this.editResponseData.newResponseText}`;
    
    this.responseService.updateResponseText(this.editResponseData.id, formattedText).subscribe({
      next: (updatedResponse) => {
        this.editResponseItem.responseText = updatedResponse.responseText;
        this.closeEditResponseDialog();
      },
      error: () => {
        this.showSuccessMessage('Грешка', 'Грешка при редакция на предложението!', 'ОК');
      }
    });
  }

  deleteResponse(item: any) {
    if (!item || !item.id) return;
    
    this.pendingDeleteItem = item;
    this.showConfirmMessage(
      'Потвърждение',
      'Сигурен ли си че искаш да премахнеш предложението?',
      'Да',
      'Отказ'
    );
  }

  showConfirmMessage(title: string, message: string, confirmText: string = 'Да', cancelText: string = 'Отказ'): void {
    this.confirmModalData = { title, message, confirmText, cancelText };
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.pendingDeleteItem = null;
  }

  confirmDeleteAction(): void {
    if (this.pendingDeleteItem) {
      const item = this.pendingDeleteItem;
      this.closeConfirmModal();
      
      this.responseService.deleteResponse(item.id).subscribe({
        next: () => {
          // Премахваме отговора от локалния масив
          this.userResponses = this.userResponses.filter(r => r.id !== item.id);
          this.showSuccessMessage('Успех', 'Предложението е премахнато успешно!', 'ОК');
        },
        error: (error: any) => {
          console.error('Error deleting response:', error);
          this.showSuccessMessage('Грешка', 'Грешка при изтриване на предложението!', 'ОК');
        }
      });
    }
  }

  showSuccessMessage(title: string, message: string, buttonText: string = 'ОК'): void {
    this.successModalData = { title, message, buttonText };
    this.showSuccessModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  getFieldLabel(field: string): string {
    switch (field) {
      case 'fixedPrice': return 'Фиксирана цена';
      case 'priceFrom': return 'Цена от';
      case 'priceTo': return 'Цена до';
      case 'availableFrom': return 'Налично от';
      case 'availableTo': return 'Налично до';
      default: return field;
    }
  }

  isImageFile(fileUrl: string): boolean {
    if (!fileUrl) return false;
    const fileName = fileUrl.toLowerCase();
    return fileName.includes('.jpg') || fileName.includes('.jpeg') || 
           fileName.includes('.png') || fileName.includes('.gif') || 
           fileName.includes('.bmp') || fileName.includes('.webp');
  }

  getFileName(fileUrl: string): string {
    if (!fileUrl) return '';
    const parts = fileUrl.split(/[\\/]/);
    return parts[parts.length - 1];
  }

  getResponseFileUrl(fileUrl: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    // Премахваме files/ или /files/ префикс за да избегнем дублиране
    let cleanPath = fileUrl.replace(/\\/g, '/');
    cleanPath = cleanPath.replace(/^\/+/, '');
    if (cleanPath.startsWith('files/')) {
      cleanPath = cleanPath.substring(6);
    }
    return `${environment.apiUrl}/files/${cleanPath}`;
  }

  openImageModal(imageUrl: string, item: any): void {
    this.selectedImage = imageUrl;
    this.showImageDialog = true;
    document.body.style.overflow = 'hidden';
  }

  openPdfInNewTab(fileUrl: string): void {
    if (!fileUrl) return;
    window.open(fileUrl, '_blank');
  }

  /**
   * Opens the chat sidebar and auto-selects the chat for the given request
   */
  openChatForRequest(requestId: string): void {
    if (requestId) {
      this.chatService.openChatForRequest(requestId);
    }
  }
}

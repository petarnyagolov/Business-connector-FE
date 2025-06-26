import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCardModule, MatCardContent } from '@angular/material/card';
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

@Component({
  selector: 'app-user-responses',
  imports: [CommonModule, MatIcon, MatCardModule, MatCardContent, FormatDateArrayPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, FormsModule],
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

  constructor(
    private responseService: ResponseService,
    private companyService: CompanyService,
    private sanitizer: DomSanitizer,
    private http: HttpClient
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
  getPictureUrl(pic: string): string {
    if (!pic) return '';
    if (pic.startsWith('http')) {
      return pic;
    }
    // Връщаме абсолютен URL към бекенда
    return 'http://localhost:8080/files/' + pic.replace(/\\/g, '/');
  }

  onImageClick(pic: string): void {
    this.selectedImage = this.pictureBlobs[pic] || this.getPictureUrl(pic);
    this.showImageDialog = true;
  }

  closeImageDialog(): void {
    this.showImageDialog = false;
    this.selectedImage = null;
  }

  openEditResponse(item: any) {
    this.editResponseItem = item;
    this.editResponseData = {
      oldResponseText: item.responseText || '',
      newResponseText: '',
      responserCompanyId: item.responserCompanyId,
      id: item.id // responseId
    };
    this.editResponseRequiredFields = item.requestCompany?.requiredFields || [];
    // Попълни всички налични стойности за requiredFields
    for (const field of this.editResponseRequiredFields) {
      if (item[field] !== undefined) {
        this.editResponseData[field] = item[field];
      }
    }
    this.showEditResponseDialog = true;
  }

  closeEditResponseDialog() {
    this.showEditResponseDialog = false;
    this.editResponseData = {};
    this.editResponseItem = null;
  }

  submitEditResponse() {
    // Валидация на requiredFields (само текстът е активен)
    if (!this.editResponseData.newResponseText || this.editResponseData.newResponseText.trim() === '') {
      alert('Моля, въведете нов текст към предложението!');
      return;
    }
    if (!this.editResponseItem) return;
    const requestCompanyId = this.editResponseItem.requestCompany?.id;
    // Добави новия текст към стария
    const combinedText = (this.editResponseData.oldResponseText ? this.editResponseData.oldResponseText + '\n' : '') + this.editResponseData.newResponseText;
    const dto = {
      id: this.editResponseData.id,
      responseText: combinedText,
      responserCompanyId: this.editResponseData.responserCompanyId,
      requestCompany: this.editResponseItem.requestCompany
    };
    // Добавяме requiredFields към dto
    for (const field of this.editResponseRequiredFields) {
      (dto as any)[field] = this.editResponseData[field];
    }
    this.responseService.updateResponse(requestCompanyId, dto).subscribe({
      next: () => {
        // Обнови локално
        this.editResponseItem.responseText = dto.responseText;
        this.editResponseItem.responserCompanyId = dto.responserCompanyId;
        for (const field of this.editResponseRequiredFields) {
          (this.editResponseItem as any)[field] = (dto as any)[field];
        }
        this.closeEditResponseDialog();
      },
      error: () => {
        alert('Грешка при редакция на предложението!');
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
      default: return field;
    }
  }
}

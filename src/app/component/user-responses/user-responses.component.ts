import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCardModule, MatCardContent } from '@angular/material/card';
import { ResponseService } from '../../service/response.service';
import { CompanyService } from '../../service/company.service';
import { FormatDateArrayPipe } from './format-date-array.pipe';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-responses',
  imports: [CommonModule, MatIcon, MatCardModule, MatCardContent, FormatDateArrayPipe],
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
}

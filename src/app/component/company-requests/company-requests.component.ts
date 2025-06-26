import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CompanyRequestService } from '../../service/company-request.service'
import { CompanyRequest } from '../../model/companyRequest';
import { MatIconModule } from '@angular/material/icon';
import { CompanyService } from '../../service/company.service';
import { ResponseService } from '../../service/response.service';
import { Company } from '../../model/company';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-company-requests',
  imports: [MatCardModule,
    MatButtonModule,
    MatPaginator,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule],
  templateUrl: './company-requests.component.html',
  styleUrl: './company-requests.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyRequestsComponent implements OnInit {
  companyRequests: CompanyRequest[] = [];
  displayedColumns: string[] = ['title', 'description', 'requesterName'];
  totalRequests: number = 0;
  pageSize: number = 20;
  currentPage: number = 0;
  searchQuery: string = '';
  searchSubject: Subject<string> = new Subject<string>();
  showReplyFormId: string | null = null;
  replyFormData: { [key: string]: { responserCompanyId: string; responseText: string } } = {};
  userCompanies: Company[] = [];

  constructor(private companyRequestService: CompanyRequestService, private router: Router, private cdr: ChangeDetectorRef, private companyService: CompanyService, private responseService: ResponseService, private sanitizer: DomSanitizer, private http: HttpClient) {
    this.searchSubject.pipe(debounceTime(1000)).subscribe((searchQuery) => {
      this.searchQuery = searchQuery;
      this.currentPage = 0; // Рестартиране на страницата при ново търсене
      this.loadRequests();
    });
  }
  ngOnInit(): void {
    this.loadRequests();
    this.companyService.getAllCompaniesByUser().subscribe(companies => this.userCompanies = companies);
    // Зареждаме снимките за всички заявки (както в user-requests)
    this.loadAllPictures();
  }
  loadRequests() {
    this.companyRequestService
    .searchRequests(this.searchQuery, this.currentPage, this.pageSize)
    .subscribe((response: any) => {
      // Преобразуване на датите, както в user-requests.component.ts
      this.companyRequests = response.content.map((req: any) => {
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
      });
      this.totalRequests = response.totalElements;
      this.cdr.markForCheck();
      this.loadAllPictures(); // за да се заредят снимките след всяко търсене
    });
  }

  loadAllPictures(): void {
    this.companyRequests.forEach(request => {
      const urls = this.getPictureUrls(request);
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

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value); 
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadRequests();
  }

  onReply(request: CompanyRequest): void {
    this.showReplyFormId = request.id;
    if (!this.replyFormData[request.id]) {
      this.replyFormData[request.id] = { responserCompanyId: '', responseText: '' };
    }
  }

  onCancelReply(): void {
    this.showReplyFormId = null;
  }

  onSubmitReply(request: CompanyRequest): void {
    const data = this.replyFormData[request.id];
    if (!data.responserCompanyId || !data.responseText) return;
    this.responseService.createResponse(request.id, data).subscribe({
      next: () => {
        alert('Предложението е изпратен успешно!');
        this.showReplyFormId = null;
        this.replyFormData[request.id] = { responserCompanyId: '', responseText: '' };
      },
      error: () => alert('Грешка при изпращане на предложението!')
    });
  }

  onSave(request: CompanyRequest): void {
    // Placeholder: тук може да се имплементира логика за запазване на обявата (например в любими)
    alert('Публикацията е запазено успешно!');
  }

  // Добавяме липсващите помощни методи за визуализация в карти
  getCompanyNameById(id: string): string {
    const company = this.userCompanies.find(c => String(c.id) === String(id));
    return company ? company.name +  ' (' + company.vatNumber + ')' : '';
  }

  getUnitLabel(unit: string): string {
    switch (unit) {
      case 'count': return 'Бр.';
      case 'box': return 'Кашон/и';
      case 'pallet': return 'Пале/та';
      default: return unit || '';
    }
  }

  getPictureUrls(request: any): string[] {
    return Array.isArray(request.pictureUrls) ? request.pictureUrls : (Array.isArray(request.pictures) ? request.pictures : []);
  }

  pictureBlobs: { [key: string]: any } = {};
  selectedImage: any = null;
  showImageDialog: boolean = false;

  getPictureUrl(pic: string): string {
    if (!pic) return '';
    if (pic.startsWith('http')) {
      return pic;
    }
    return 'http://localhost:8080/files' + pic.replace(/\\/g, '/');
  }

  onImageClick(pic: string): void {
    this.selectedImage = this.pictureBlobs[pic] || this.getPictureUrl(pic);
    this.showImageDialog = true;
  }

  closeImageDialog(): void {
    this.showImageDialog = false;
    this.selectedImage = null;
  }

  openRequestInNewTab(requestId: string) {
    window.open('/requests/' + requestId, '_blank');
  }

  public navigateToRequest(requestId: string) {
    this.router.navigate(['/requests', requestId]);
  }

  shareRequest(requestId: string): void {
    const url = `${window.location.origin}/requests/${requestId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.showCopyTooltip(requestId);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.showCopyTooltip(requestId);
      } catch {}
      document.body.removeChild(textarea);
    }
  }

  copyTooltipRequestId: string | null = null;

  showCopyTooltip(requestId: string) {
    this.copyTooltipRequestId = requestId;
    setTimeout(() => {
      if (this.copyTooltipRequestId === requestId) {
        this.copyTooltipRequestId = null;
      }
    }, 1500);
  }

}

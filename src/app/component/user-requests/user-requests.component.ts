import { Component, OnInit, OnDestroy } from '@angular/core';
import { CompanyRequest } from '../../model/companyRequest';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
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

@Component({
  selector: 'app-user-requests',
  imports: [RouterOutlet, RouterLink, CommonModule, MatGridListModule, MatCardModule, MatButtonModule, MatIconModule, FormatDateArrayPipe],
  templateUrl: './user-requests.component.html',
  styleUrl: './user-requests.component.scss',
  standalone: true
})
export class UserRequestsComponent implements OnInit, OnDestroy {
    companyRequests: CompanyRequest[] = [];
    showCancelButton: boolean = false; 
    userCompanies: Company[] = [];
    responsesByRequestId: { [requestId: string]: any[] } = {};
    expandedRequestId: string | null = null;
    private destroy$ = new Subject<void>();

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

  selectedResponseByRequestId: { [requestId: string]: any } = {};
  acceptLoadingByRequestId: { [requestId: string]: boolean } = {};
  acceptSuccessByRequestId: { [requestId: string]: boolean } = {};
  acceptErrorByRequestId: { [requestId: string]: boolean } = {};

  constructor(
    private router: Router,
    private companyRequestService: CompanyRequestService,
    private companyService: CompanyService,
    private sanitizer: DomSanitizer,
    private http: HttpClient
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
    
    // Слушаме само за NavigationEnd events и ограничаваме броя извиквания
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.showCancelButton = this.router.url.includes('/create');
        // Зареждаме requests само ако сме в user-requests маршрута
        if (this.router.url.includes('/my-requests')) {
          this.loadRequests();
        }
      });
    
    // Първоначално зареждане
    this.loadRequests();
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
          this.responsesByRequestId[req.id] = [];
          
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

  toggleResponses(requestId: string): void {
    this.expandedRequestId = this.expandedRequestId === requestId ? null : requestId;
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

  selectResponse(requestId: string, response: any) {
    this.selectedResponseByRequestId[requestId] = response;
    this.acceptSuccessByRequestId[requestId] = false;
    this.acceptErrorByRequestId[requestId] = false;
  }

  acceptResponse(requestId: string) {
    const response = this.selectedResponseByRequestId[requestId];
    if (!response) return;
    this.acceptLoadingByRequestId[requestId] = true;
    this.acceptSuccessByRequestId[requestId] = false;
    this.acceptErrorByRequestId[requestId] = false;
    const payload = {
      requestId: requestId,
      responseId: response.id,
      responserCompanyId: response.responserCompanyId
    };
    this.companyRequestService.confirmResponse(payload).subscribe({
      next: () => {
        this.acceptLoadingByRequestId[requestId] = false;
        this.acceptSuccessByRequestId[requestId] = true;
      },
      error: () => {
        this.acceptLoadingByRequestId[requestId] = false;
        this.acceptErrorByRequestId[requestId] = true;
      }
    });
  }
}

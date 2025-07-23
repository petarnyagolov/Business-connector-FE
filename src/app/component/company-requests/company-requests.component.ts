import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { CompanyRequestService } from '../../service/company-request.service'
import { CompanyRequest } from '../../model/companyRequest';
import { MatIconModule } from '@angular/material/icon';
import { CompanyService } from '../../service/company.service';
import { Company } from '../../model/company';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { FormatDateArrayPipe } from '../user-responses/format-date-array.pipe';
import { SavedRequestsService } from '../../service/saved-requests.service';

@Component({
  selector: 'app-company-requests',
  imports: [MatCardModule,
    MatButtonModule,
    MatPaginator,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    FormatDateArrayPipe],
  templateUrl: './company-requests.component.html',
  styleUrl: './company-requests.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyRequestsComponent implements OnInit, OnDestroy {
  companyRequests: CompanyRequest[] = [];
  displayedColumns: string[] = ['title', 'description', 'requesterName'];
  totalRequests: number = 0;
  pageSize: number = 20;
  currentPage: number = 0;
  searchQuery: string = '';
  searchSubject: Subject<string> = new Subject<string>();
  private destroy$ = new Subject<void>();
  userCompanies: Company[] = [];

  constructor(
    private companyRequestService: CompanyRequestService, 
    private router: Router, 
    private cdr: ChangeDetectorRef, 
    private companyService: CompanyService, 
    private sanitizer: DomSanitizer, 
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private savedRequestsService: SavedRequestsService
  ) {
    this.searchSubject.pipe(
      debounceTime(1000),
      takeUntil(this.destroy$)
    ).subscribe((searchQuery) => {
      this.searchQuery = searchQuery;
      this.currentPage = 0; 
      this.loadRequests();
    });
  }
  ngOnInit(): void {
    this.loadRequests();
    this.companyService.getAllCompaniesByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(companies => this.userCompanies = companies);
    this.loadAllPictures();
    
    // Load saved requests to enable local checking
    this.savedRequestsService.getAllSavedRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.cdr.markForCheck(),
        error: (error) => console.error('Error loading saved requests:', error)
      });

    this.companyRequestService.getAllRequestsByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.cdr.markForCheck(),
        error: (error) => console.error('Error loading user requests:', error)
      });
  }
  loadRequests() {
    this.companyRequestService
    .searchRequests(this.searchQuery, this.currentPage, this.pageSize)
    .subscribe((response: any) => {
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
      this.loadAllPictures(); 
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

  onSave(request: CompanyRequest): void {
    this.savedRequestsService.toggleSavedRequest(request.id).subscribe({
      next: (isSaved) => {
        const message = isSaved ? 'Публикацията е запазена успешно!' : 'Публикацията е премахната от запазените!';
        this.snackBar.open(message, 'Затвори', { duration: 3000 });
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error toggling saved request:', error);
        this.snackBar.open('Грешка при запазване на публикацията!', 'Затвори', { duration: 3000 });
      }
    });
  }

  isRequestSaved(requestId: string): boolean {
    return this.savedRequestsService.isRequestSavedLocally(requestId);
  }

  isMyRequest(requestId: string): boolean {
    const result = this.companyRequestService.isUserRequest(requestId);
    console.log(`Checking if request ${requestId} is mine: ${result}`);
    return result;
  }

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
    return `${environment.apiUrl}/files` + pic.replace(/\\/g, '/');
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

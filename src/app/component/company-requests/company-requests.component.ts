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
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
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
        
        // Създаваме масив с файлове ако липсва
        if (!req.files && req.fileUrls && Array.isArray(req.fileUrls)) {
          req.files = req.fileUrls.map((fileUrl: string) => {
            // Премахваме всички слашове в началото на fileUrl
            const cleanFileUrl = fileUrl.replace(/^[\/\\]+/, '');
            // Формираме URL-а като внимаваме да няма дублирани слашове
            const url = fileUrl.startsWith('http') ? 
                        fileUrl : 
                        `${environment.apiUrl}/files/${cleanFileUrl.replace(/\\/g, '/')}`;
            
            console.log('Оригинален fileUrl:', fileUrl);
            console.log('Почистен fileUrl:', cleanFileUrl);
            console.log('Генериран URL:', url);
            
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
    // Проверяваме първо за files масива, който създадохме
    if (Array.isArray(request.files)) {
      const imageFiles = request.files.filter((file: any) => file.isImage);
      if (imageFiles.length > 0) {
        return imageFiles.map((file: any) => file.url);
      }
    }
    
    // Ако няма files с изображения, използваме pictureUrls или pictures
    const pictureUrls = Array.isArray(request.pictureUrls) ? request.pictureUrls : [];
    const pictures = Array.isArray(request.pictures) ? request.pictures : [];
    
    // Използваме Set за да премахнем дублирането
    return [...new Set([...pictureUrls, ...pictures])];
  }

  pictureBlobs: { [key: string]: any } = {};
  selectedImage: any = null;
  showImageDialog: boolean = false;
  currentImageIndex: number = 0;
  imageFiles: { url: string, name: string }[] = [];

  getPictureUrl(pic: string): string {
    if (!pic) return '';
    if (pic.startsWith('http')) {
      return pic;
    }
    // Премахваме всички слашове в началото на pic
    const cleanPic = pic.replace(/^[\/\\]+/, '');
    return `${environment.apiUrl}/files/${cleanPic.replace(/\\/g, '/')}`;
  }

  onImageClick(pic: string, request: any): void {
    this.openImageModal(pic, request);
  }

  // Инициализира масива с изображения само от конкретната публикация
  initializeImageFilesForRequest(request: any): void {
    this.imageFiles = [];
    
    // Първо проверяваме дали има директно files масив с изображения
    if (request.files && request.files.length) {
      const imageFiles = request.files
        .filter((file: {isImage: boolean}) => file.isImage)
        .map((file: {url: string, name: string}) => ({
          url: file.url,
          name: file.name
        }));
      this.imageFiles.push(...imageFiles);
      
      // Ако имаме изображения в files, не добавяме от pictureUrls
      if (this.imageFiles.length > 0) {
        console.log(`Инициализирани ${this.imageFiles.length} изображения от files за публикация "${request.title}"`);
        return;
      }
    }
    
    // Добавяме изображения от pictureUrls масива само ако няма в files
    if (!request.files || request.files.length === 0 || 
        !request.files.some((file: {isImage: boolean}) => file.isImage)) {
      
      const pictureUrls = Array.isArray(request.pictureUrls) ? 
                        request.pictureUrls : 
                        (Array.isArray(request.pictures) ? request.pictures : []);
                        
      if (pictureUrls && pictureUrls.length) {
        pictureUrls.forEach((pic: string) => {
          const url = this.pictureBlobs[pic] || this.getPictureUrl(pic);
          const name = pic.split('/').pop() || pic;
          this.imageFiles.push({ url, name });
        });
        console.log(`Инициализирани ${this.imageFiles.length} изображения от pictureUrls за публикация "${request.title}"`);
      }
    }
    
    // Премахваме дубликати (ако случайно има такива)
    const uniqueUrls = new Set<string>();
    this.imageFiles = this.imageFiles.filter(img => {
      if (uniqueUrls.has(img.url)) {
        return false;
      }
      uniqueUrls.add(img.url);
      return true;
    });
    
    console.log(`Общо ${this.imageFiles.length} уникални изображения за публикация "${request.title}"`);
    
    
    console.log(`Инициализирани ${this.imageFiles.length} изображения за публикация "${request.title}"`);
  }

  // Стария метод оставяме за обратна съвместимост
  initializeImageFiles(): void {
    this.imageFiles = [];
    
    this.companyRequests.forEach(request => {
      if (request.files && request.files.length) {
        const imageFiles = request.files
          .filter((file: {isImage: boolean}) => file.isImage)
          .map((file: {url: string, name: string}) => ({
            url: file.url,
            name: file.name
          }));
        this.imageFiles.push(...imageFiles);
      }
      
      // В стария метод също правим промяна да не се дублират изображенията
      // Добавяме изображения от pictureUrls само ако този request няма files с изображения
      if (!request.files || request.files.length === 0 || 
          !request.files.some((file: {isImage: boolean}) => file.isImage)) {
        
        // Използваме директно pictureUrls и pictures масиви, а не getPictureUrls,
        // за да избегнем дублиране на изображения от files
        const pictureUrls = Array.isArray(request.pictureUrls) ? 
                          request.pictureUrls : 
                          (Array.isArray(request.pictures) ? request.pictures : []);
        
        if (pictureUrls && pictureUrls.length) {
          pictureUrls.forEach((pic: string) => {
            const url = this.pictureBlobs[pic] || this.getPictureUrl(pic);
            const name = pic.split('/').pop() || pic;
            this.imageFiles.push({ url, name });
          });
        }
      }
    });
  }
  
  openImageModal(imageUrl: string, request?: any): void {
    // Ако имаме конкретна публикация, инициализираме изображенията само от нея
    if (request) {
      this.initializeImageFilesForRequest(request);
    }
    // В противен случай, инициализираме всички изображения (обратна съвместимост)
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

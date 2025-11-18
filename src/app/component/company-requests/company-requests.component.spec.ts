import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyRequestsComponent } from './company-requests.component';
import { CompanyRequestService } from '../../service/company-request.service';
import { CompanyService } from '../../service/company.service';
import { SavedRequestsService } from '../../service/saved-requests.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { CompanyRequest } from '../../model/companyRequest';
import { Company } from '../../model/company';
import { ChangeDetectorRef } from '@angular/core';

describe('CompanyRequestsComponent', () => {
  let component: CompanyRequestsComponent;
  let fixture: ComponentFixture<CompanyRequestsComponent>;
  let companyRequestService: jasmine.SpyObj<CompanyRequestService>;
  let companyService: jasmine.SpyObj<CompanyService>;
  let savedRequestsService: jasmine.SpyObj<SavedRequestsService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;
  let httpTestingController: HttpTestingController;

  const mockCompanyRequest: CompanyRequest = {
    id: '1',
    title: 'Test Request',
    description: 'Test Description',
    capacity: 10,
    unit: 'count',
    priceFrom: 100,
    priceTo: 200,
    availableFrom: new Date('2025-01-01'),
    availableTo: new Date('2025-12-31'),
    requesterCompanyId: 'company1',
    requesterName: 'Test Company',
    requestType: 'service',
    status: 'active',
    pictureUrls: ['picture1.jpg'],
    pictures: [],
    fileUrls: [],
    files: [],
    requiredFields: []
  };

  const mockCompany: Company = {
    id: 'company1',
    name: 'Test Company',
    vatNumber: '123456789',
    country: 'Bulgaria',
    city: 'Sofia',
    address: 'Test Address',
    email: 'test@test.com',
    phone: '1234567890',
    industry: 'IT',
    description: 'Test Description',
    logoPath: ''
  };

  beforeEach(async () => {
    const companyRequestServiceSpy = jasmine.createSpyObj('CompanyRequestService', 
      ['searchRequests', 'getAllRequestsByUser', 'isUserRequest']);
    const companyServiceSpy = jasmine.createSpyObj('CompanyService', ['getAllCompaniesByUser']);
    const savedRequestsServiceSpy = jasmine.createSpyObj('SavedRequestsService', 
      ['toggleSavedRequest', 'getAllSavedRequests', 'isRequestSavedLocally']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Default mock responses
    companyRequestServiceSpy.searchRequests.and.returnValue(of({
      content: [mockCompanyRequest],
      totalElements: 1
    }));
    companyServiceSpy.getAllCompaniesByUser.and.returnValue(of([mockCompany]));
    savedRequestsServiceSpy.getAllSavedRequests.and.returnValue(of([]));
    companyRequestServiceSpy.getAllRequestsByUser.and.returnValue(of([]));
    savedRequestsServiceSpy.isRequestSavedLocally.and.returnValue(false);
    companyRequestServiceSpy.isUserRequest.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [CompanyRequestsComponent, HttpClientTestingModule]
    })
    .overrideComponent(CompanyRequestsComponent, {
      set: {
        providers: [
          { provide: CompanyRequestService, useValue: companyRequestServiceSpy },
          { provide: CompanyService, useValue: companyServiceSpy },
          { provide: SavedRequestsService, useValue: savedRequestsServiceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: Router, useValue: routerSpy }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyRequestsComponent);
    component = fixture.componentInstance;
    companyRequestService = companyRequestServiceSpy;
    companyService = companyServiceSpy;
    savedRequestsService = savedRequestsServiceSpy;
    snackBar = snackBarSpy;
    router = routerSpy;
    httpTestingController = TestBed.inject(HttpTestingController);
    // Don't call detectChanges here - let each test control when to trigger initialization
  });

  afterEach(() => {
    // Flush any pending HTTP requests (like image loads) before verify
    const pendingRequests = httpTestingController.match(() => true);
    pendingRequests.forEach(req => req.flush(new Blob()));
    
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.companyRequests).toEqual([]);
    expect(component.totalRequests).toBe(0);
    expect(component.pageSize).toBe(20);
    expect(component.currentPage).toBe(0);
    expect(component.searchQuery).toBe('');
    expect(component.userCompanies).toEqual([]);
  });

  it('should load requests on init', () => {
    fixture.detectChanges(); // triggers ngOnInit

    expect(companyRequestService.searchRequests).toHaveBeenCalledWith('', 0, 20);
    expect(component.companyRequests.length).toBe(1);
    expect(component.totalRequests).toBe(1);
  });

  it('should load user companies on init', () => {
    fixture.detectChanges();

    expect(companyService.getAllCompaniesByUser).toHaveBeenCalled();
    expect(component.userCompanies.length).toBe(1);
    expect(component.userCompanies[0]).toEqual(mockCompany);
  });

  it('should load saved requests on init', () => {
    fixture.detectChanges();

    expect(savedRequestsService.getAllSavedRequests).toHaveBeenCalled();
  });

  it('should load user requests on init', () => {
    fixture.detectChanges();

    expect(companyRequestService.getAllRequestsByUser).toHaveBeenCalled();
  });

  it('should handle search with debounce', fakeAsync(() => {
    fixture.detectChanges();
    companyRequestService.searchRequests.calls.reset();

    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: { value: 'test query' }, enumerable: true });
    
    component.onSearch(event);
    
    expect(companyRequestService.searchRequests).not.toHaveBeenCalled();
    
    tick(1000);
    
    expect(companyRequestService.searchRequests).toHaveBeenCalledWith('test query', 0, 20);
    expect(component.searchQuery).toBe('test query');
    expect(component.currentPage).toBe(0);
  }));

  it('should handle page change', () => {
    fixture.detectChanges();
    companyRequestService.searchRequests.calls.reset();

    const pageEvent = { pageIndex: 2, pageSize: 10 };
    component.onPageChange(pageEvent);

    expect(component.currentPage).toBe(2);
    expect(component.pageSize).toBe(10);
    expect(companyRequestService.searchRequests).toHaveBeenCalledWith('', 2, 10);
  });

  it('should toggle saved request successfully', () => {
    savedRequestsService.toggleSavedRequest.and.returnValue(of(true));
    fixture.detectChanges();

    component.onSave(mockCompanyRequest);

    expect(savedRequestsService.toggleSavedRequest).toHaveBeenCalledWith('1');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Публикацията е запазена успешно!',
      'Затвори',
      { duration: 3000 }
    );
  });

  it('should toggle unsaved request successfully', () => {
    savedRequestsService.toggleSavedRequest.and.returnValue(of(false));
    fixture.detectChanges();

    component.onSave(mockCompanyRequest);

    expect(savedRequestsService.toggleSavedRequest).toHaveBeenCalledWith('1');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Публикацията е премахната от запазените!',
      'Затвори',
      { duration: 3000 }
    );
  });

  it('should handle error when toggling saved request', () => {
    savedRequestsService.toggleSavedRequest.and.returnValue(
      throwError(() => new Error('Error'))
    );
    fixture.detectChanges();

    component.onSave(mockCompanyRequest);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Грешка при запазване на публикацията!',
      'Затвори',
      { duration: 3000 }
    );
  });

  it('should check if request is saved', () => {
    savedRequestsService.isRequestSavedLocally.and.returnValue(true);
    fixture.detectChanges();

    const result = component.isRequestSaved('1');

    expect(result).toBe(true);
    expect(savedRequestsService.isRequestSavedLocally).toHaveBeenCalledWith('1');
  });

  it('should check if request is user request', () => {
    companyRequestService.isUserRequest.and.returnValue(true);
    fixture.detectChanges();

    const result = component.isMyRequest('1');

    expect(result).toBe(true);
    expect(companyRequestService.isUserRequest).toHaveBeenCalledWith('1');
  });

  it('should get company name by id', () => {
    fixture.detectChanges();

    const result = component.getCompanyNameById('company1');

    expect(result).toBe('Test Company (123456789)');
  });

  it('should return empty string for unknown company id', () => {
    fixture.detectChanges();

    const result = component.getCompanyNameById('unknown');

    expect(result).toBe('');
  });

  it('should get unit label for count', () => {
    const result = component.getUnitLabel('count');
    expect(result).toBe('Бр.');
  });

  it('should get unit label for box', () => {
    const result = component.getUnitLabel('box');
    expect(result).toBe('Кашон/и');
  });

  it('should get unit label for pallet', () => {
    const result = component.getUnitLabel('pallet');
    expect(result).toBe('Пале/та');
  });

  it('should return original unit for unknown unit', () => {
    const result = component.getUnitLabel('custom');
    expect(result).toBe('custom');
  });

  it('should get picture URLs from files with images', () => {
    const request = {
      files: [
        { url: 'image1.jpg', isImage: true },
        { url: 'image2.png', isImage: true },
        { url: 'document.pdf', isImage: false }
      ]
    };

    const result = component.getPictureUrls(request);

    expect(result).toEqual(['image1.jpg', 'image2.png']);
  });

  it('should get picture URLs from pictureUrls array', () => {
    const request = {
      pictureUrls: ['picture1.jpg', 'picture2.jpg']
    };

    const result = component.getPictureUrls(request);

    expect(result).toEqual(['picture1.jpg', 'picture2.jpg']);
  });

  it('should navigate to request', () => {
    component.navigateToRequest('123');

    expect(router.navigate).toHaveBeenCalledWith(['/requests', '123']);
  });

  it('should open request in new tab', () => {
    spyOn(window, 'open');

    component.openRequestInNewTab('123');

    expect(window.open).toHaveBeenCalledWith('/requests/123', '_blank');
  });

  it('should share request URL', (done) => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    
    component.shareRequest('123');

    setTimeout(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/requests/123`
      );
      expect(component.copyTooltipRequestId).toBe('123');
      done();
    }, 0);
  });

  it('should hide copy tooltip after delay', (done) => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    
    component.shareRequest('123');

    setTimeout(() => {
      expect(component.copyTooltipRequestId).toBe('123');
      
      setTimeout(() => {
        expect(component.copyTooltipRequestId).toBe(null);
        done();
      }, 1600);
    }, 0);
  });

  it('should open PDF in new tab', () => {
    spyOn(window, 'open');

    component.openPdfInNewTab('document.pdf');

    expect(window.open).toHaveBeenCalledWith('document.pdf', '_blank');
  });

  it('should initialize image files for request with files', () => {
    const request = {
      title: 'Test',
      files: [
        { url: 'image1.jpg', name: 'image1.jpg', isImage: true },
        { url: 'image2.png', name: 'image2.png', isImage: true }
      ]
    };

    component.initializeImageFilesForRequest(request);

    expect(component.imageFiles.length).toBe(2);
    expect(component.imageFiles[0].url).toBe('image1.jpg');
    expect(component.imageFiles[1].url).toBe('image2.png');
  });

  it('should open image modal', () => {
    const request = {
      title: 'Test',
      files: [{ url: 'image1.jpg', name: 'image1.jpg', isImage: true }]
    };

    component.openImageModal('image1.jpg', request);

    expect(component.showImageDialog).toBe(true);
    expect(component.selectedImage).toBe('image1.jpg');
  });

  it('should close image modal', () => {
    component.showImageDialog = true;
    component.selectedImage = 'image.jpg';

    component.closeImageDialog();

    expect(component.showImageDialog).toBe(false);
    expect(component.selectedImage).toBe(null);
  });

  it('should navigate to next image', () => {
    component.imageFiles = [
      { url: 'image1.jpg', name: 'image1.jpg' },
      { url: 'image2.jpg', name: 'image2.jpg' }
    ];
    component.currentImageIndex = 0;
    component.selectedImage = 'image1.jpg';

    component.nextImage();

    expect(component.currentImageIndex).toBe(1);
    expect(component.selectedImage).toBe('image2.jpg');
  });

  it('should navigate to previous image', () => {
    component.imageFiles = [
      { url: 'image1.jpg', name: 'image1.jpg' },
      { url: 'image2.jpg', name: 'image2.jpg' }
    ];
    component.currentImageIndex = 1;
    component.selectedImage = 'image2.jpg';

    component.previousImage();

    expect(component.currentImageIndex).toBe(0);
    expect(component.selectedImage).toBe('image1.jpg');
  });

  it('should wrap to last image when going previous from first', () => {
    component.imageFiles = [
      { url: 'image1.jpg', name: 'image1.jpg' },
      { url: 'image2.jpg', name: 'image2.jpg' }
    ];
    component.currentImageIndex = 0;

    component.previousImage();

    expect(component.currentImageIndex).toBe(1);
  });

  it('should wrap to first image when going next from last', () => {
    component.imageFiles = [
      { url: 'image1.jpg', name: 'image1.jpg' },
      { url: 'image2.jpg', name: 'image2.jpg' }
    ];
    component.currentImageIndex = 1;

    component.nextImage();

    expect(component.currentImageIndex).toBe(0);
  });

  it('should handle keyboard navigation - arrow right', () => {
    component.imageFiles = [
      { url: 'image1.jpg', name: 'image1.jpg' },
      { url: 'image2.jpg', name: 'image2.jpg' }
    ];
    component.currentImageIndex = 0;
    component.showImageDialog = true;

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    spyOn(event, 'preventDefault');
    
    component.handleKeydown(event);

    expect(component.currentImageIndex).toBe(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle keyboard navigation - arrow left', () => {
    component.imageFiles = [
      { url: 'image1.jpg', name: 'image1.jpg' },
      { url: 'image2.jpg', name: 'image2.jpg' }
    ];
    component.currentImageIndex = 1;
    component.showImageDialog = true;

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    spyOn(event, 'preventDefault');
    
    component.handleKeydown(event);

    expect(component.currentImageIndex).toBe(0);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle keyboard navigation - escape', () => {
    component.showImageDialog = true;

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(event, 'preventDefault');
    
    component.handleKeydown(event);

    expect(component.showImageDialog).toBe(false);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle keyboard navigation - space', () => {
    component.imageFiles = [
      { url: 'image1.jpg', name: 'image1.jpg' },
      { url: 'image2.jpg', name: 'image2.jpg' }
    ];
    component.currentImageIndex = 0;
    component.showImageDialog = true;

    const event = new KeyboardEvent('keydown', { key: ' ' });
    spyOn(event, 'preventDefault');
    
    component.handleKeydown(event);

    expect(component.currentImageIndex).toBe(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle error loading saved requests', () => {
    savedRequestsService.getAllSavedRequests.and.returnValue(
      throwError(() => new Error('Error'))
    );
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(console.error).toHaveBeenCalledWith('Error loading saved requests:', jasmine.any(Error));
  });

  it('should handle error loading user requests', () => {
    companyRequestService.getAllRequestsByUser.and.returnValue(
      throwError(() => new Error('Error'))
    );
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(console.error).toHaveBeenCalledWith('Error loading user requests:', jasmine.any(Error));
  });

  it('should convert array date format to Date object in requests', () => {
    const requestWithArrayDate = {
      ...mockCompanyRequest,
      activeFrom: [2025, 1, 15, 10, 30],
      activeTo: [2025, 12, 31, 23, 59]
    };

    companyRequestService.searchRequests.and.returnValue(of({
      content: [requestWithArrayDate],
      totalElements: 1
    }));

    fixture.detectChanges();

    expect((component.companyRequests[0] as any).activeFrom instanceof Date).toBe(true);
    expect((component.companyRequests[0] as any).activeTo instanceof Date).toBe(true);
  });

  it('should cleanup on destroy', () => {
    fixture.detectChanges();
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

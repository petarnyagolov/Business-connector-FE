import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyRequestService } from './company-request.service';
import { environment } from '../../environments/environment';

describe('CompanyRequestService', () => {
  let service: CompanyRequestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyRequestService]
    });
    service = TestBed.inject(CompanyRequestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should process filesCount in searchRequests for unauthenticated users', (done) => {
    const mockResponse = {
      content: [
        {
          id: '1',
          title: 'Test Request',
          description: 'Test description...',
          filesCount: 3,
          pictureUrls: []
        }
      ]
    };

    service.searchRequests('test', 0, 10).subscribe(response => {
      expect(response.content[0].filesCount).toBe(3);
      expect(response.content[0].files).toBeDefined();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/request-company/search?query=test&page=0&size=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should process files array for authenticated users in searchRequests', (done) => {
    const mockResponse = {
      content: [
        {
          id: '1',
          title: 'Test Request',
          description: 'Test description',
          fileUrls: ['uploads\\test.pdf'],
          pictureUrls: []
        }
      ]
    };

    service.searchRequests('test', 0, 10).subscribe(response => {
      expect(response.content[0].files.length).toBe(1);
      expect(response.content[0].files[0].name).toBe('test.pdf');
      expect(response.content[0].filesCount).toBe(1);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/request-company/search?query=test&page=0&size=10`);
    req.flush(mockResponse);
  });

  it('should process filesCount in getRequestById for unauthenticated users', (done) => {
    const mockResponse = {
      request: {
        id: '1',
        title: 'Test Request',
        description: 'Test description...',
        filesCount: 5,
        pictureUrls: []
      }
    };

    service.getRequestById('1').subscribe(response => {
      expect(response.request.filesCount).toBe(5);
      expect(response.request.files).toBeDefined();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/request-company/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should prioritize backend filesCount over calculated length', (done) => {
    const mockResponse = {
      content: [
        {
          id: '1',
          title: 'Test Request',
          filesCount: 10, // Backend says 10 files exist
          fileUrls: [], // But no access for this user
          pictureUrls: []
        }
      ]
    };

    service.searchRequests('test', 0, 10).subscribe(response => {
      expect(response.content[0].filesCount).toBe(10);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/request-company/search?query=test&page=0&size=10`);
    req.flush(mockResponse);
  });
});

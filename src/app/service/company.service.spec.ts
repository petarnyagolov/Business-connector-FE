import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyService } from './company.service';
import { Company } from '../model/company';
import { environment } from '../../environments/environment';

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;

  const mockCompany: Company = {
    id: '1',
    name: 'Test Company',
    vatNumber: '123456789',
    country: 'Bulgaria',
    city: 'Sofia',
    address: 'Test Address',
    email: 'test@test.com',
    phone: '1234567890',
    industry: 'IT',
    description: 'Test Description',
    logoPath: 'logo.png'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyService]
    });
    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllCompaniesByUser', () => {
    it('should fetch user companies', () => {
      const mockCompanies = [mockCompany];

      service.getAllCompaniesByUser().subscribe(companies => {
        expect(companies).toEqual(mockCompanies);
        expect(companies.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user/companies`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCompanies);
    });

    it('should cache user companies on subsequent calls', () => {
      const mockCompanies = [mockCompany];

      // First call
      service.getAllCompaniesByUser().subscribe();
      const req1 = httpMock.expectOne(`${environment.apiUrl}/user/companies`);
      req1.flush(mockCompanies);

      // Second call - should use cache, no HTTP request
      service.getAllCompaniesByUser().subscribe(companies => {
        expect(companies).toEqual(mockCompanies);
      });

      httpMock.expectNone(`${environment.apiUrl}/user/companies`);
    });

    it('should handle error and clear cache', () => {
      service.getAllCompaniesByUser().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user/companies`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getAllCompanies', () => {
    it('should have getAllCompanies method', () => {
      expect(service.getAllCompanies).toBeDefined();
    });

    it('should fetch all companies', () => {
      const mockCompanies = [mockCompany];

      service.getAllCompanies().subscribe(companies => {
        expect(companies).toEqual(mockCompanies);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user/companies`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCompanies);
    });
  });

  describe('getCompany', () => {
    it('should have getCompany method', () => {
      expect(service.getCompany).toBeDefined();
    });

    it('should fetch a single company by id', () => {
      const companyId = 1;

      service.getCompany(companyId).subscribe(company => {
        expect(company).toEqual(mockCompany);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${companyId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCompany);
    });
  });

  describe('createCompany', () => {
    it('should have createCompany method', () => {
      expect(service.createCompany).toBeDefined();
    });

    it('should create a new company', () => {
      const formData = new FormData();
      formData.append('name', 'Test Company');

      service.createCompany(formData).subscribe(company => {
        expect(company).toEqual(mockCompany);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user/companies`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(formData);
      req.flush(mockCompany);
    });
  });

  describe('updateCompany', () => {
    it('should have updateCompany method', () => {
      expect(service.updateCompany).toBeDefined();
    });

    it('should update an existing company', () => {
      service.updateCompany(mockCompany).subscribe(company => {
        expect(company).toEqual(mockCompany);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${mockCompany.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockCompany);
      req.flush(mockCompany);
    });
  });

  describe('deleteCompany', () => {
    it('should have deleteCompany method', () => {
      expect(service.deleteCompany).toBeDefined();
    });

    it('should delete a company', () => {
      const companyId = 1;

      service.deleteCompany(companyId).subscribe(response => {
        expect(response).toEqual({});
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${companyId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('searchCompanies', () => {
    it('should search companies with query and pagination', () => {
      const query = 'test';
      const page = 0;
      const size = 10;
      const mockResponse = {
        content: [mockCompany],
        totalElements: 1
      };

      service.searchCompanies(query, page, size).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/companies/search?query=${query}&page=${page}&size=${size}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getCompanyByVatNumber', () => {
    it('should get company by VAT number', () => {
      const vatNumber = '123456789';

      service.getCompanyByVatNumber(vatNumber).subscribe(company => {
        expect(company).toEqual(mockCompany);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${vatNumber}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCompany);
    });
  });

  describe('getCompanyByVatNumberAndUser', () => {
    it('should get company by VAT number for current user', () => {
      const vatNumber = '123456789';

      service.getCompanyByVatNumberAndUser(vatNumber).subscribe(company => {
        expect(company).toEqual(mockCompany);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/user/companies/${vatNumber}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCompany);
    });
  });

  describe('getCompanyInfoFromOutside', () => {
    it('should fetch company info from external source and validate', () => {
      const vatNumber = '123456789';
      const country = 'Bulgaria';
      const mockResponse = {
        countryCode: 'BG',
        vatNumber: '208494389',
        requestDate: '2026-01-22T13:18:19.197Z',
        valid: true,
        name: 'ЕКС ДИЙЛ ХЪБ - ООД',
        address: 'ул. Карлово №8 ет.1 ап.4 обл.ПЛЕВЕН, гр.ПЛЕВЕН 5800',
        requestIdentifier: '',
        traderName: '---'
      };

      service.getCompanyInfoFromOutside(vatNumber, country).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.valid).toBe(true);
        expect(response.name).toBe('ЕКС ДИЙЛ ХЪБ - ООД');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/utils/company/${vatNumber}?country=${country}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error when VAT is invalid', () => {
      const vatNumber = '123456789';
      const country = 'Bulgaria';
      const mockResponse = {
        countryCode: 'BG',
        vatNumber: '123456789',
        valid: false,
        name: '',
        address: '',
        requestIdentifier: ''
      };

      service.getCompanyInfoFromOutside(vatNumber, country).subscribe({
        next: () => fail('Should have thrown error for invalid VAT'),
        error: (error) => {
          expect(error.message).toContain('невалиден');
        }
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/utils/company/${vatNumber}?country=${country}`
      );
      req.flush(mockResponse);
    });

    it('should handle error when fetching company info', () => {
      const vatNumber = '123456789';
      const country = 'Bulgaria';

      service.getCompanyInfoFromOutside(vatNumber, country).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/utils/company/${vatNumber}?country=${country}`
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getCountryNames', () => {
    it('should fetch country names', () => {
      const mockCountries = ['Bulgaria', 'Romania', 'Greece'];

      service.getCountryNames().subscribe(countries => {
        expect(countries).toEqual(mockCountries);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/utils/countries`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCountries);
    });

    it('should cache country names on subsequent calls', () => {
      const mockCountries = ['Bulgaria', 'Romania'];

      // First call
      service.getCountryNames().subscribe();
      const req1 = httpMock.expectOne(`${environment.apiUrl}/utils/countries`);
      req1.flush(mockCountries);

      // Second call - should use cache
      service.getCountryNames().subscribe(countries => {
        expect(countries).toEqual(mockCountries);
      });

      httpMock.expectNone(`${environment.apiUrl}/utils/countries`);
    });
  });

  describe('getLogoByPath', () => {
    it('should fetch logo blob by path', () => {
      const path = 'logo.png';
      const mockBlob = new Blob(['logo data'], { type: 'image/png' });

      service.getLogoByPath(path).subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/files/${path}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('cache management', () => {
    it('should cache user companies manually', () => {
      const mockCompanies = [mockCompany];

      service.cacheUserCompanies(mockCompanies);

      service.getAllCompaniesByUser().subscribe(companies => {
        expect(companies).toEqual(mockCompanies);
      });

      // Should not make HTTP request
      httpMock.expectNone(`${environment.apiUrl}/user/companies`);
    });

    it('should clear user companies cache', () => {
      const mockCompanies = [mockCompany];

      // Cache companies
      service.cacheUserCompanies(mockCompanies);
      service.getAllCompaniesByUser().subscribe();
      httpMock.expectNone(`${environment.apiUrl}/user/companies`);

      // Clear cache
      service.clearUserCompaniesCache();

      // Should make HTTP request after cache cleared
      service.getAllCompaniesByUser().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/user/companies`);
      req.flush(mockCompanies);
    });
  });
});

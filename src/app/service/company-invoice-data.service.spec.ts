import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyInvoiceDataService } from './company-invoice-data.service';
import { CompanyInvoiceData, CompanyInvoiceDataDto } from '../model/company-invoice-data';
import { environment } from '../../environments/environment';

describe('CompanyInvoiceDataService', () => {
  let service: CompanyInvoiceDataService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyInvoiceDataService]
    });
    service = TestBed.inject(CompanyInvoiceDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get invoice data for a company', () => {
    const companyId = '12345678-1234-1234-1234-123456789012';
    const mockInvoiceData: CompanyInvoiceData = {
      id: 'invoice-1',
      companyId: companyId,
      invoiceName: 'Test Company Ltd',
      vatNumber: 'BG201544117',
      invoiceAddress: 'Sofia, Bulgaria'
    };

    service.getInvoiceData(companyId).subscribe((data) => {
      expect(data).toEqual(mockInvoiceData);
      expect(data.invoiceName).toBe('Test Company Ltd');
      expect(data.vatNumber).toBe('BG201544117');
    });

    const req = httpMock.expectOne(`${apiUrl}/api/companies/${companyId}/invoice-data`);
    expect(req.request.method).toBe('GET');
    req.flush(mockInvoiceData);
  });

  it('should create or update invoice data', () => {
    const companyId = '12345678-1234-1234-1234-123456789012';
    const invoiceDto: CompanyInvoiceDataDto = {
      companyId: companyId,
      invoiceName: 'New Company Name',
      vatNumber: 'BG123456789',
      invoiceAddress: 'Plovdiv, Bulgaria',
      mol: 'Ivan Petrov'
    };

    const mockResponse: CompanyInvoiceData = {
      ...invoiceDto,
      id: 'invoice-2',
      createdAt: new Date()
    };

    service.createOrUpdateInvoiceData(companyId, invoiceDto).subscribe((data) => {
      expect(data).toEqual(mockResponse);
      expect(data.invoiceName).toBe('New Company Name');
      expect(data.mol).toBe('Ivan Petrov');
    });

    const req = httpMock.expectOne(`${apiUrl}/api/companies/${companyId}/invoice-data`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(invoiceDto);
    req.flush(mockResponse);
  });

  it('should delete invoice data', () => {
    const companyId = '12345678-1234-1234-1234-123456789012';

    service.deleteInvoiceData(companyId).subscribe((response) => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/api/companies/${companyId}/invoice-data`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should handle 404 error when invoice data not found', () => {
    const companyId = '12345678-1234-1234-1234-123456789012';

    service.getInvoiceData(companyId).subscribe(
      () => fail('Should have failed with 404 error'),
      (error) => {
        expect(error.status).toBe(404);
      }
    );

    const req = httpMock.expectOne(`${apiUrl}/api/companies/${companyId}/invoice-data`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });
});

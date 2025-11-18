import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CompanyRequestService } from './company-request.service';

describe('CompanyRequestService', () => {
  let service: CompanyRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyRequestService]
    });
    service = TestBed.inject(CompanyRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { CompanyService } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompanyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have getCompanies method', () => {
    expect(service.getCompanies).toBeDefined();
  });

  it('should have getCompany method', () => {
    expect(service.getCompany).toBeDefined();
  });

  it('should have createCompany method', () => {
    expect(service.createCompany).toBeDefined();
  });

  it('should have updateCompany method', () => {
    expect(service.updateCompany).toBeDefined();
  });

  it('should have deleteCompany method', () => {
    expect(service.deleteCompany).toBeDefined();
  });
  
});

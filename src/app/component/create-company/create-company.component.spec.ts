import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { CreateCompanyComponent } from './create-company.component';
import { CompanyService } from '../../service/company.service';
import { IndustryService } from '../../service/industry.service';
import { CompanyValidationService } from '../../service/company-validation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyFormComponent } from '../company-form/company-form.component';

describe('CreateCompanyComponent', () => {
  let component: CreateCompanyComponent;
  let fixture: ComponentFixture<CreateCompanyComponent>;
  let companyServiceSpy: jasmine.SpyObj<CompanyService>;
  let industryServiceSpy: jasmine.SpyObj<IndustryService>;
  let companyValidationServiceSpy: jasmine.SpyObj<CompanyValidationService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Create spy objects
    const companyServiceMock = jasmine.createSpyObj('CompanyService', [
      'getCountryNames',
      'getCompanyInfoFromOutside',
      'createCompany'
    ]);
    const industryServiceMock = jasmine.createSpyObj('IndustryService', ['getAllIndustries']);
    const companyValidationServiceMock = jasmine.createSpyObj('CompanyValidationService', [
      'validateCompany',
      'showCompanyCreatedSuccess',
      'showCompanyCreationError'
    ]);
    const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        CreateCompanyComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: IndustryService, useValue: industryServiceMock },
        { provide: CompanyValidationService, useValue: companyValidationServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    }).compileComponents();

    companyServiceSpy = TestBed.inject(CompanyService) as jasmine.SpyObj<CompanyService>;
    industryServiceSpy = TestBed.inject(IndustryService) as jasmine.SpyObj<IndustryService>;
    companyValidationServiceSpy = TestBed.inject(CompanyValidationService) as jasmine.SpyObj<CompanyValidationService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    // Default mock returns
    companyServiceSpy.getCountryNames.and.returnValue(of(['Bulgaria', 'Germany', 'France']));
    industryServiceSpy.getAllIndustries.and.returnValue(of([
      { value: 'IT', viewValue: 'Information Technology' },
      { value: 'FINANCE', viewValue: 'Finance' }
    ]));

    fixture = TestBed.createComponent(CreateCompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Constructor and Initialization', () => {
    it('should call getCountryNames on construction', () => {
      expect(companyServiceSpy.getCountryNames).toHaveBeenCalled();
    });

    it('should populate countries array', () => {
      expect(component.countries.length).toBeGreaterThan(0);
      expect(component.countries).toContain('Bulgaria');
    });

    it('should initialize employeesSizes with predefined values', () => {
      expect(component.employeesSizes.length).toBe(5);
      expect(component.employeesSizes[0]).toEqual({ value: '1-10', viewValue: '1-10' });
    });
  });

  describe('onCompanyValidate', () => {
    it('should call companyValidationService.validateCompany with correct parameters', () => {
      const data = { vatNumber: '123456789', country: 'BG' };
      
      component.onCompanyValidate(data);
      
      expect(companyValidationServiceSpy.validateCompany).toHaveBeenCalledWith(
        data.vatNumber,
        data.country,
        jasmine.any(Object)
      );
    });

    it('should set validation flags on success', () => {
      const data = { vatNumber: '123456789', country: 'BG' };
      
      // Simulate success callback
      companyValidationServiceSpy.validateCompany.and.callFake((vat, country, callbacks) => {
        callbacks.onSuccess();
      });
      
      component.onCompanyValidate(data);
      
      expect(component.isValidVatNumber).toBeTruthy();
      expect(component.showCompanyDetails).toBeTruthy();
    });

    it('should update companyFormComponentRef on success when ref exists', () => {
      const data = { vatNumber: '123456789', country: 'BG' };
      const mockCompanyFormComponent = jasmine.createSpyObj('CompanyFormComponent', [
        'setCompanyDetailsVisible',
        'setVatValid'
      ]);
      component.companyFormComponentRef = mockCompanyFormComponent;
      
      companyValidationServiceSpy.validateCompany.and.callFake((vat, country, callbacks) => {
        callbacks.onSuccess();
      });
      
      component.onCompanyValidate(data);
      
      expect(mockCompanyFormComponent.setCompanyDetailsVisible).toHaveBeenCalledWith(true);
      expect(mockCompanyFormComponent.setVatValid).toHaveBeenCalledWith(true);
    });

    it('should reset validation flags on error', () => {
      const data = { vatNumber: '999999999', country: 'BG' };
      
      companyValidationServiceSpy.validateCompany.and.callFake((vat, country, callbacks) => {
        callbacks.onError();
      });
      
      component.onCompanyValidate(data);
      
      expect(component.isValidVatNumber).toBeFalsy();
      expect(component.showCompanyDetails).toBeFalsy();
    });

    it('should update companyFormComponentRef on error when ref exists', () => {
      const data = { vatNumber: '999999999', country: 'BG' };
      const mockCompanyFormComponent = jasmine.createSpyObj('CompanyFormComponent', [
        'setCompanyDetailsVisible',
        'setVatValid'
      ]);
      component.companyFormComponentRef = mockCompanyFormComponent;
      
      companyValidationServiceSpy.validateCompany.and.callFake((vat, country, callbacks) => {
        callbacks.onError();
      });
      
      component.onCompanyValidate(data);
      
      expect(mockCompanyFormComponent.setCompanyDetailsVisible).toHaveBeenCalledWith(false);
      expect(mockCompanyFormComponent.setVatValid).toHaveBeenCalledWith(false);
    });
  });

  describe('onCompanyFormSubmit', () => {
    const mockCompanyResponse = {
      vatNumber: '123456789',
      name: 'Test Company',
      country: 'BG',
      city: 'Sofia',
      address: 'Test Address',
      industry: 'IT',
      description: 'Test Description',
      phone: '+359888888888',
      email: 'test@company.com'
    };

    it('should call companyService.createCompany with FormData', () => {
      const companyData = {
        vatNumber: '123456789',
        companyName: 'Test Company',
        country: 'BG'
      };
      
      companyServiceSpy.createCompany.and.returnValue(of(mockCompanyResponse));
      
      component.onCompanyFormSubmit(companyData);
      
      expect(companyServiceSpy.createCompany).toHaveBeenCalledWith(jasmine.any(FormData));
    });

    it('should include logo in FormData when selectedLogo exists', () => {
      const companyData = { vatNumber: '123456789' };
      const mockFile = new File(['content'], 'logo.png', { type: 'image/png' });
      component.selectedLogo = mockFile;
      
      companyServiceSpy.createCompany.and.returnValue(of(mockCompanyResponse));
      
      component.onCompanyFormSubmit(companyData);
      
      expect(companyServiceSpy.createCompany).toHaveBeenCalled();
    });

    it('should show success notification on successful company creation', (done) => {
      const companyData = { vatNumber: '123456789' };
      companyServiceSpy.createCompany.and.returnValue(of(mockCompanyResponse));
      
      component.onCompanyFormSubmit(companyData);
      
      setTimeout(() => {
        expect(companyValidationServiceSpy.showCompanyCreatedSuccess).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should emit companyCreated event on success', (done) => {
      const companyData = { vatNumber: '123456789' };
      companyServiceSpy.createCompany.and.returnValue(of(mockCompanyResponse));
      
      spyOn(component.companyCreated, 'emit');
      
      component.onCompanyFormSubmit(companyData);
      
      setTimeout(() => {
        expect(component.companyCreated.emit).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should show error notification on company creation failure', (done) => {
      const companyData = { vatNumber: '123456789' };
      companyServiceSpy.createCompany.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.onCompanyFormSubmit(companyData);
      
      setTimeout(() => {
        expect(companyValidationServiceSpy.showCompanyCreationError).toHaveBeenCalled();
        done();
      }, 50);
    });

    it('should log error to console on failure', (done) => {
      const companyData = { vatNumber: '123456789' };
      const error = { status: 500, message: 'Server error' };
      companyServiceSpy.createCompany.and.returnValue(throwError(() => error));
      
      spyOn(console, 'error');
      
      component.onCompanyFormSubmit(companyData);
      
      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith(
          '❌ Company creation failed:',
          error
        );
        done();
      }, 50);
    });
  });

  describe('getIndustries', () => {
    it('should call industryService with provided country', () => {
      component.getIndustries('BG');
      
      expect(industryServiceSpy.getAllIndustries).toHaveBeenCalledWith('BG');
    });

    it('should populate industries array on success', () => {
      component.getIndustries('BG');
      
      expect(component.industries.length).toBe(2);
      expect(component.industries[0].value).toBe('IT');
      expect(component.industries[0].viewValue).toBe('Information Technology');
    });

    it('should clear industries array if no country selected', () => {
      component.industries = [{ value: 'IT', viewValue: 'IT' }];
      component.countries = []; // No countries available
      
      component.getIndustries(undefined);
      
      expect(component.industries.length).toBe(0);
      expect(industryServiceSpy.getAllIndustries).not.toHaveBeenCalled();
    });

    it('should use first country from array if no country provided', () => {
      component.countries = ['Bulgaria', 'Germany'];
      
      component.getIndustries();
      
      expect(industryServiceSpy.getAllIndustries).toHaveBeenCalledWith('Bulgaria');
    });

    it('should set error message when industries request fails with 404', () => {
      industryServiceSpy.getAllIndustries.and.returnValue(
        throwError(() => ({ status: 404 }))
      );
      
      component.getIndustries('BG');
      
      expect(component.errorMessage).toBe('Няма индустрии за тази държава.');
      expect(component.industries.length).toBe(0);
    });

    it('should set generic error message for unexpected errors', () => {
      industryServiceSpy.getAllIndustries.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.getIndustries('BG');
      
      expect(component.errorMessage).toBe('Възникна неочаквана грешка при зареждане на индустрии.');
    });
  });

  describe('onCountryChanged', () => {
    it('should call getIndustries with selected country', () => {
      spyOn(component, 'getIndustries');
      const event = { value: 'Germany' };
      
      component.onCountryChanged(event);
      
      expect(component.getIndustries).toHaveBeenCalledWith('Germany');
    });
  });

  describe('onLogoChange', () => {
    it('should update selectedLogo when file is provided', () => {
      const mockFile = new File(['content'], 'logo.png', { type: 'image/png' });
      
      component.onLogoChange(mockFile);
      
      expect(component.selectedLogo).toBe(mockFile);
    });

    it('should set selectedLogo to null when no file provided', () => {
      component.selectedLogo = new File(['content'], 'logo.png');
      
      component.onLogoChange(null);
      
      expect(component.selectedLogo).toBeNull();
    });
  });

  describe('onCancelCompanyForm', () => {
    it('should emit cancelled event', () => {
      spyOn(component.cancelled, 'emit');
      spyOn(console, 'log');
      
      component.onCancelCompanyForm();
      
      expect(console.log).toHaveBeenCalledWith('🔸 Company creation cancelled');
      expect(component.cancelled.emit).toHaveBeenCalled();
    });
  });

  describe('submitForm', () => {
    it('should call companyFormComponent.onSubmit when form is valid', () => {
      const mockCompanyFormComponent = jasmine.createSpyObj('CompanyFormComponent', ['onSubmit']);
      mockCompanyFormComponent.companyForm = { valid: true };
      component.companyFormComponentRef = mockCompanyFormComponent;
      component.isValidVatNumber = true;
      component.showCompanyDetails = true;
      
      component.submitForm();
      
      expect(mockCompanyFormComponent.onSubmit).toHaveBeenCalled();
    });

    it('should not submit if companyFormComponentRef is undefined', () => {
      component.companyFormComponentRef = undefined as any;
      
      component.submitForm();
      
      // Should not throw error
      expect(component.companyFormComponentRef).toBeUndefined();
    });

    it('should not submit if canSubmit returns false', () => {
      const mockCompanyFormComponent = jasmine.createSpyObj('CompanyFormComponent', ['onSubmit']);
      mockCompanyFormComponent.companyForm = { valid: false };
      component.companyFormComponentRef = mockCompanyFormComponent;
      
      component.submitForm();
      
      expect(mockCompanyFormComponent.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('canSubmit', () => {
    it('should return true when all conditions are met', () => {
      const mockCompanyFormComponent = { companyForm: { valid: true } };
      component.companyFormComponentRef = mockCompanyFormComponent as any;
      component.isValidVatNumber = true;
      component.showCompanyDetails = true;
      
      const result = component.canSubmit();
      
      expect(result).toBeTruthy();
    });

    it('should return false when form is invalid', () => {
      const mockCompanyFormComponent = { companyForm: { valid: false } };
      component.companyFormComponentRef = mockCompanyFormComponent as any;
      component.isValidVatNumber = true;
      component.showCompanyDetails = true;
      
      const result = component.canSubmit();
      
      expect(result).toBeFalsy();
    });

    it('should return false when VAT number is not valid', () => {
      const mockCompanyFormComponent = { companyForm: { valid: true } };
      component.companyFormComponentRef = mockCompanyFormComponent as any;
      component.isValidVatNumber = false;
      component.showCompanyDetails = true;
      
      const result = component.canSubmit();
      
      expect(result).toBeFalsy();
    });

    it('should return false when company details are not shown', () => {
      const mockCompanyFormComponent = { companyForm: { valid: true } };
      component.companyFormComponentRef = mockCompanyFormComponent as any;
      component.isValidVatNumber = true;
      component.showCompanyDetails = false;
      
      const result = component.canSubmit();
      
      expect(result).toBeFalsy();
    });

    it('should return false when companyFormComponentRef is undefined', () => {
      component.companyFormComponentRef = undefined as any;
      component.isValidVatNumber = true;
      component.showCompanyDetails = true;
      
      const result = component.canSubmit();
      
      expect(result).toBeFalsy();
    });
  });
});


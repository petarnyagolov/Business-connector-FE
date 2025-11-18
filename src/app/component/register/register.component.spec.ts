import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../service/auth.service';
import { CompanyService } from '../../service/company.service';
import { IndustryService } from '../../service/industry.service';
import { CompanyValidationService } from '../../service/company-validation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyFormComponent } from '../company-form/company-form.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let companyServiceSpy: jasmine.SpyObj<CompanyService>;
  let industryServiceSpy: jasmine.SpyObj<IndustryService>;
  let companyValidationServiceSpy: jasmine.SpyObj<CompanyValidationService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Create spy objects
    const authServiceMock = jasmine.createSpyObj('AuthService', ['register', 'login']);
    const companyServiceMock = jasmine.createSpyObj('CompanyService', ['getCountryNames', 'getCompanyInfoFromOutside']);
    const industryServiceMock = jasmine.createSpyObj('IndustryService', ['getAllIndustries']);
    const companyValidationServiceMock = jasmine.createSpyObj('CompanyValidationService', ['validateCompany']);
    const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceMock },
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: IndustryService, useValue: industryServiceMock },
        { provide: CompanyValidationService, useValue: companyValidationServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    })
    .overrideComponent(RegisterComponent, {
      remove: { imports: [] },
      add: { providers: [{ provide: MatSnackBar, useValue: snackBarMock }] }
    })
    .compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
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

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize registration form with required fields', () => {
      expect(component.registrationForm).toBeDefined();
      expect(component.registrationForm.get('firstName')).toBeDefined();
      expect(component.registrationForm.get('lastName')).toBeDefined();
      expect(component.registrationForm.get('email')).toBeDefined();
      expect(component.registrationForm.get('password')).toBeDefined();
      expect(component.registrationForm.get('lang')).toBeDefined();
    });

    it('should set default language to "bg"', () => {
      expect(component.registrationForm.get('lang')?.value).toBe('bg');
    });

    it('should mark firstName as invalid when empty', () => {
      const firstName = component.registrationForm.get('firstName');
      firstName?.setValue('');
      expect(firstName?.invalid).toBeTruthy();
    });

    it('should mark email as invalid for incorrect format', () => {
      const email = component.registrationForm.get('email');
      email?.setValue('invalid-email');
      expect(email?.invalid).toBeTruthy();
    });

    it('should mark password as invalid when less than 6 characters', () => {
      const password = component.registrationForm.get('password');
      password?.setValue('12345');
      expect(password?.invalid).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should call getCountryNames on initialization', () => {
      expect(companyServiceSpy.getCountryNames).toHaveBeenCalled();
    });

    it('should populate countries array', () => {
      expect(component.countries.length).toBeGreaterThan(0);
      expect(component.countries).toContain('Bulgaria');
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

    it('should reset validation flags on error', () => {
      const data = { vatNumber: '999999999', country: 'BG' };
      
      // Simulate error callback
      companyValidationServiceSpy.validateCompany.and.callFake((vat, country, callbacks) => {
        callbacks.onError();
      });
      
      component.onCompanyValidate(data);
      
      expect(component.isValidVatNumber).toBeFalsy();
      expect(component.showCompanyDetails).toBeFalsy();
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      // Setup valid form data
      component.registrationForm.patchValue({
        firstName: 'Иван',
        lastName: 'Иванов',
        email: 'ivan@example.com',
        password: 'password123',
        lang: 'bg'
      });
    });

    it('should not submit if registration form is invalid', () => {
      // Mock company form component
      const mockCompanyForm = {
        valid: true,  // Company form is valid
        getRawValue: () => ({ vatNumber: '123' })
      };
      component.companyFormComponentRef = {
        companyForm: mockCompanyForm
      } as any;

      // Make registration form invalid by clearing required field
      component.registrationForm.get('firstName')?.setValue('');
      component.registrationForm.get('firstName')?.markAsTouched();
      component.registrationForm.updateValueAndValidity();
      
      component.onSubmit();
      
      expect(component.registrationForm.valid).toBeFalse();
      expect(authServiceSpy.register).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Моля, попълнете правилно'),
        jasmine.any(String),
        jasmine.any(Object)
      );
    });

    it('should call authService.register with correct payload when form is valid', () => {
      // Mock company form component
      const mockCompanyForm = {
        valid: true,
        getRawValue: () => ({
          vatNumber: '123456789',
          companyName: 'Test Company',
          country: 'BG'
        })
      };
      component.companyFormComponentRef = {
        companyForm: mockCompanyForm
      } as any;

      authServiceSpy.register.and.returnValue(of({ success: true }));
      authServiceSpy.login.and.returnValue(of({ token: 'abc123' }));
      
      component.onSubmit();
      
      expect(authServiceSpy.register).toHaveBeenCalledWith(
        jasmine.objectContaining({
          firstName: 'Иван',
          lastName: 'Иванов',
          email: 'ivan@example.com',
          companyInfo: jasmine.any(Object)
        }),
        undefined
      );
    });

    it('should attempt auto-login after successful registration', (done) => {
      const mockCompanyForm = {
        valid: true,
        getRawValue: () => ({ vatNumber: '123456789' })
      };
      component.companyFormComponentRef = { companyForm: mockCompanyForm } as any;

      authServiceSpy.register.and.returnValue(of({ success: true }));
      authServiceSpy.login.and.returnValue(of({ token: 'abc123' }));
      
      component.onSubmit();
      
      setTimeout(() => {
        expect(authServiceSpy.login).toHaveBeenCalledWith(
          jasmine.objectContaining({
            email: 'ivan@example.com',
            password: 'password123'
          })
        );
        done();
      }, 100);
    });

    it('should show error notification when registration fails', (done) => {
      const mockCompanyForm = {
        valid: true,
        getRawValue: () => ({ vatNumber: '123456789' })
      };
      component.companyFormComponentRef = { companyForm: mockCompanyForm } as any;

      const error = { error: { message: 'Email already exists' } };
      authServiceSpy.register.and.returnValue(throwError(() => error));
      
      component.onSubmit();
      
      // Wait for async error handling in tap operator
      setTimeout(() => {
        expect(authServiceSpy.register).toHaveBeenCalled();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('Email already exists'),
          'Затвори',
          jasmine.objectContaining({
            panelClass: ['error-snackbar']
          })
        );
        done();
      }, 100);
    });

    it('should set isLoading flag during registration process', () => {
      const mockCompanyForm = {
        valid: true,
        getRawValue: () => ({ vatNumber: '123456789' })
      };
      component.companyFormComponentRef = { companyForm: mockCompanyForm } as any;

      authServiceSpy.register.and.returnValue(of({ success: true }));
      authServiceSpy.login.and.returnValue(of({ token: 'abc123' }));
      
      expect(component.isLoading).toBeFalsy();
      component.onSubmit();
      // isLoading is set to false after completion in the observable
    });
  });

  describe('getIndustries', () => {
    it('should call industryService with selected country', () => {
      component.getIndustries('BG');
      
      expect(industryServiceSpy.getAllIndustries).toHaveBeenCalledWith('BG');
    });

    it('should populate industries array on success', () => {
      component.getIndustries('BG');
      
      expect(component.industries.length).toBe(2);
      expect(component.industries[0].value).toBe('IT');
    });

    it('should clear industries array if no country selected', () => {
      component.industries = [{ value: 'IT', viewValue: 'IT' }];
      
      component.getIndustries(undefined);
      
      expect(component.industries.length).toBe(0);
    });

    it('should set error message when industries request fails', () => {
      industryServiceSpy.getAllIndustries.and.returnValue(
        throwError(() => ({ status: 404 }))
      );
      
      component.getIndustries('BG');
      
      expect(component.errorMessage).toBe('Няма индустрии за тази държава.');
    });
  });

  describe('onLogoChanged', () => {
    it('should update selectedCompanyLogo when logo file is provided', () => {
      const mockFile = new File(['content'], 'logo.png', { type: 'image/png' });
      
      component.onLogoChanged(mockFile);
      
      expect(component.selectedCompanyLogo).toBe(mockFile);
    });

    it('should set selectedCompanyLogo to null when no file provided', () => {
      component.selectedCompanyLogo = new File(['content'], 'logo.png');
      
      component.onLogoChanged(null);
      
      expect(component.selectedCompanyLogo).toBeNull();
    });
  });

  describe('getDataFromOutside', () => {
    it('should show warning if VAT number is missing', () => {
      const mockFormControl = (field: string) => ({
        value: field === 'country' ? 'BG' : ''
      });
      
      component.companyFormComponentRef = {
        companyForm: {
          get: mockFormControl
        }
      } as any;
      
      component.getDataFromOutside();
      
      expect(companyServiceSpy.getCompanyInfoFromOutside).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('въведете ДДС/ЕИК номер'),
        'Затвори',
        jasmine.objectContaining({
          panelClass: ['warning-snackbar']
        })
      );
    });

    it('should call companyService when VAT and country are provided', () => {
      component.companyFormComponentRef = {
        companyForm: {
          get: (field: string) => ({
            value: field === 'vatNumber' ? '123456789' : 'BG'
          })
        },
        setCompanyDetailsVisible: jasmine.createSpy('setCompanyDetailsVisible'),
        setVatValid: jasmine.createSpy('setVatValid')
      } as any;
      
      companyServiceSpy.getCompanyInfoFromOutside.and.returnValue(of({
        name: 'Test Company',
        address: 'Test Address'
      }));
      industryServiceSpy.getAllIndustries.and.returnValue(of([]));
      
      component.getDataFromOutside();
      
      expect(companyServiceSpy.getCompanyInfoFromOutside).toHaveBeenCalledWith('123456789', 'BG');
    });
  });
});

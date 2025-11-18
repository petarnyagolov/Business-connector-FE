import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyValidationService } from './company-validation.service';
import { CompanyService } from './company.service';
import { of, throwError } from 'rxjs';

describe('CompanyValidationService', () => {
  let service: CompanyValidationService;
  let companyServiceSpy: jasmine.SpyObj<CompanyService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const companyServiceMock = jasmine.createSpyObj('CompanyService', ['getCompanyInfoFromOutside']);
    const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        CompanyValidationService,
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    });

    service = TestBed.inject(CompanyValidationService);
    companyServiceSpy = TestBed.inject(CompanyService) as jasmine.SpyObj<CompanyService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateCompany', () => {
    it('should call onSuccess callback and show success notification when validation succeeds', (done) => {
      const vatNumber = '123456789';
      const country = 'BG';
      const mockResponse = { valid: true };
      companyServiceSpy.getCompanyInfoFromOutside.and.returnValue(of(mockResponse));
      
      const callbacks = {
        onSuccess: jasmine.createSpy('onSuccess'),
        onError: jasmine.createSpy('onError')
      };

      service.validateCompany(vatNumber, country, callbacks);

      setTimeout(() => {
        expect(companyServiceSpy.getCompanyInfoFromOutside).toHaveBeenCalledWith(vatNumber, country);
        expect(callbacks.onSuccess).toHaveBeenCalled();
        expect(callbacks.onError).not.toHaveBeenCalled();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          '✓ Фирмата е валидирана успешно!',
          'Затвори',
          jasmine.objectContaining({
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          })
        );
        done();
      }, 100);
    });

    it('should call onError callback and show error notification when validation fails with 404', (done) => {
      const vatNumber = '999999999';
      const country = 'BG';
      const errorResponse = { status: 404 };
      companyServiceSpy.getCompanyInfoFromOutside.and.returnValue(throwError(() => errorResponse));
      
      const callbacks = {
        onSuccess: jasmine.createSpy('onSuccess'),
        onError: jasmine.createSpy('onError')
      };

      // Act
      service.validateCompany(vatNumber, country, callbacks);

      // Assert
      setTimeout(() => {
        expect(companyServiceSpy.getCompanyInfoFromOutside).toHaveBeenCalledWith(vatNumber, country);
        expect(callbacks.onSuccess).not.toHaveBeenCalled();
        expect(callbacks.onError).toHaveBeenCalled();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          '✗ Фирмата не е намерена в регистъра.',
          'Затвори',
          jasmine.objectContaining({
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          })
        );
        done();
      }, 100);
    });

    it('should show appropriate error message when validation fails with 400', (done) => {
      const vatNumber = '123456789';
      const country = 'BG';
      const errorResponse = { status: 400 };
      companyServiceSpy.getCompanyInfoFromOutside.and.returnValue(throwError(() => errorResponse));
      
      const callbacks = {
        onSuccess: jasmine.createSpy('onSuccess'),
        onError: jasmine.createSpy('onError')
      };

      service.validateCompany(vatNumber, country, callbacks);

      setTimeout(() => {
        expect(callbacks.onError).toHaveBeenCalled();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          '✗ Фирмата вече съществува в базата данни.',
          'Затвори',
          jasmine.objectContaining({
            panelClass: ['error-snackbar']
          })
        );
        done();
      }, 100);
    });

    it('should show generic error message for unexpected errors', (done) => {
      const vatNumber = '123456789';
      const country = 'BG';
      const errorResponse = { status: 500 };
      companyServiceSpy.getCompanyInfoFromOutside.and.returnValue(throwError(() => errorResponse));
      
      const callbacks = {
        onSuccess: jasmine.createSpy('onSuccess'),
        onError: jasmine.createSpy('onError')
      };

      service.validateCompany(vatNumber, country, callbacks);

      setTimeout(() => {
        expect(callbacks.onError).toHaveBeenCalled();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          '✗ Възникна неочаквана грешка. Опитайте отново.',
          'Затвори',
          jasmine.objectContaining({
            panelClass: ['error-snackbar']
          })
        );
        done();
      }, 100);
    });

    it('should attempt to scroll to company details section after successful validation', (done) => {
      const vatNumber = '123456789';
      const country = 'BG';
      companyServiceSpy.getCompanyInfoFromOutside.and.returnValue(of({}));
      
      const mockElement = jasmine.createSpyObj('HTMLElement', ['scrollIntoView']);
      spyOn(document, 'querySelector').and.returnValue(mockElement);
      
      const callbacks = {
        onSuccess: jasmine.createSpy('onSuccess'),
        onError: jasmine.createSpy('onError')
      };

      service.validateCompany(vatNumber, country, callbacks);

      setTimeout(() => {
        expect(document.querySelector).toHaveBeenCalledWith(
          '.company-details-section, [formGroupName="company"], .company-form-section'
        );
        expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
        done();
      }, 400);
    });
  });

  describe('showCompanyCreatedSuccess', () => {
    it('should show success notification for company creation', () => {
      service.showCompanyCreatedSuccess();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        '✓ Имате нова фирма!',
        'Затвори',
        jasmine.objectContaining({
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        })
      );
    });
  });

  describe('showCompanyCreationError', () => {
    it('should show error notification for company creation failure', () => {
      // Act
      service.showCompanyCreationError();

      // Assert
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        '✗ Създаването на фирмата се провали. Моля, опитайте отново.',
        'Затвори',
        jasmine.objectContaining({
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        })
      );
    });
  });
});

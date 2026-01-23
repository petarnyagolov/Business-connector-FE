import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyService } from './company.service';
import { IndustryService } from './industry.service';

@Injectable({
  providedIn: 'root'
})
export class CompanyValidationService {

  constructor(
    private companyService: CompanyService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Validates company VAT number and shows appropriate notifications
   * @param vatNumber - Company VAT/EIK number
   * @param country - Country code
   * @param callbacks - Object containing success and error callbacks with optional response data
   */
  validateCompany(
    vatNumber: string, 
    country: string,
    callbacks: {
      onSuccess: (response?: any) => void,
      onError: () => void
    }
  ): void {
    this.companyService.getCompanyInfoFromOutside(vatNumber, country).subscribe({
      next: (response) => {
        console.log('✅ VAT validation response:', response);
        
        // Проверка дали ДДС номерът е валиден
        if (!response.valid) {
          this.snackBar.open('✗ ДДС номерът е невалиден според VIES системата', 'Затвори', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          callbacks.onError();
          return;
        }
        
        // Успешна валидация
        this.snackBar.open('✓ Фирмата е валидирана успешно!', 'Затвори', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        setTimeout(() => {
          const companyDetailsElement = document.querySelector(
            '.company-details-section, [formGroupName="company"], .company-form-section'
          );
          if (companyDetailsElement) {
            companyDetailsElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 300);

        callbacks.onSuccess(response);
      },
      error: (error) => {
        let errorMsg = 'Възникна неочаквана грешка. Опитайте отново.';
        if (error.status === 404) {
          errorMsg = 'Фирмата не е намерена в регистъра.';
        } else if (error.status === 400) {
          errorMsg = 'Фирмата вече съществува в базата данни.';
        } else if (error.message && error.message.includes('невалиден')) {
          errorMsg = error.message;
        }
        
        this.snackBar.open('✗ ' + errorMsg, 'Затвори', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });

        callbacks.onError();
      }
    });
  }

  showCompanyCreatedSuccess(): void {
    this.snackBar.open('✓ Имате нова фирма!', 'Затвори', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  showCompanyCreationError(): void {
    this.snackBar.open('✗ Създаването на фирмата се провали. Моля, опитайте отново.', 'Затвори', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}

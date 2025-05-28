import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from '../../service/company.service';
import { CompanyFormComponent } from './company-form.component';

@Component({
  selector: 'app-company-form-update-wrapper',
  standalone: true,
  imports: [CompanyFormComponent],
  template: `
    <app-company-form
      [mode]="'update'"
      [initialValues]="company"
      [disabledFields]="['country','vatNumber','name','industry']"
      (formSubmit)="onUpdate($event)"
    ></app-company-form>
  `
})
export class CompanyFormUpdateWrapperComponent {
  company: any = null;
  private route = inject(ActivatedRoute);
  private companyService = inject(CompanyService);
  private router = inject(Router);

  ngOnInit() {
    const vatNumber = this.route.snapshot.paramMap.get('vatNumber');
    if (vatNumber) {
      this.companyService.getCompanyByVatNumberAndUser(vatNumber).subscribe({
        next: (data) => this.company = data,
        error: () => alert('Неуспешно зареждане на фирмата!')
      });
    }
  }

  onUpdate(updatedData: any) {
    this.companyService.updateCompany(updatedData).subscribe({
      next: () => {
        alert('Фирмата е обновена успешно!');
        this.router.navigate(['/user/companies']);
      },
      error: () => alert('Грешка при обновяване!')
    });
  }
}

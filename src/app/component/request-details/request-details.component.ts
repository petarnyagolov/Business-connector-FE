import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CompanyRequestService } from '../../service/company-request.service';
import { CompanyRequest } from '../../model/companyRequest';
import { CompanyService } from '../../service/company.service';
import { Company } from '../../model/company';
import { ResponseService } from '../../service/response.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatError } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatOptionModule, MatCardModule, MatIconModule],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.scss'
})
export class RequestDetailsComponent implements OnInit {
  request: CompanyRequest | null = null;
  responses: any[] = [];
  companies: Company[] = [];
  responseForm: FormGroup;
  responseSuccess: boolean = false;
  showResponseForm: boolean = true;
  editResponseData: any = {};
  editResponseItem: any = null;
  showEditResponseDialog: boolean = false;
  picturePreview: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private companyRequestService: CompanyRequestService,
    private companyService: CompanyService,
    private responseService: ResponseService,
    private fb: FormBuilder
  ) {
    this.responseForm = this.fb.group({
      responserCompanyId: ['', Validators.required],
      message: ['', Validators.required],
      fixedPrice: [''],
      priceFrom: [''],
      priceTo: [''],
      availableFrom: [''],
      availableTo: [''],
      picture: [null]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.companyRequestService.getRequestById(id).subscribe(res => {
        this.request = res.request;
        this.responses = res.responses || [];
      });
    }
    this.companyService.getAllCompaniesByUser().subscribe(companies => this.companies = companies);
  }

  onSubmit(): void {
    if (!this.request) return;
    // Валидация на requiredFields
    if (this.request.requiredFields && Array.isArray(this.request.requiredFields)) {
      for (const field of this.request.requiredFields) {
        if (field === 'picture') {
          if (!this.responseForm.get('picture')?.value) {
            alert('Снимката е задължителна!');
            return;
          }
        } else if (!this.responseForm.get(field) || this.responseForm.get(field)?.value === '' || this.responseForm.get(field)?.value == null) {
          alert('Полето ' + this.getFieldLabel(field) + ' е задължително!');
          return;
        }
      }
    }
    if (this.responseForm.invalid) return;
    // Подгответе dto с всички полета, които backend очаква
    const dto: any = {};
    Object.keys(this.responseForm.controls).forEach(key => {
      if (key !== 'picture') {
        // Преименуваме message -> responseText
        if (key === 'message') {
          dto['responseText'] = this.responseForm.get('message')?.value;
        } else {
          dto[key] = this.responseForm.get(key)?.value;
        }
      }
    });
    // Съберете файловете (ако има)
    const pictures: File[] = [];
    if (this.responseForm.get('picture')?.value) {
      pictures.push(this.responseForm.get('picture')?.value);
    }
    this.responseService.createResponse(this.request.id, dto, pictures).subscribe({
      next: () => {
        this.responseSuccess = true;
        this.showResponseForm = false;
      },
      error: () => this.responseSuccess = false
    });
  }

  getFieldLabel(field: string): string {
    switch (field) {
      case 'fixedPrice': return 'Фиксирана цена';
      case 'priceFrom': return 'Цена от';
      case 'priceTo': return 'Цена до';
      case 'availableFrom': return 'Налично от';
      case 'availableTo': return 'Налично до';
      case 'picture': return 'Снимка';
      default: return field;
    }
  }

  editResponse(resp: any) {
    this.editResponseItem = resp;
    this.editResponseData = {
      responseText: resp.responseText,
      responserCompanyId: resp.responserCompanyId,
      id: resp.id
    };
    this.showEditResponseDialog = true;
  }

  closeEditResponseDialog() {
    this.showEditResponseDialog = false;
    this.editResponseData = {};
    this.editResponseItem = null;
  }

  submitEditResponse() {
    if (!this.editResponseItem) return;
    const requestCompanyId = this.request?.id;
    const dto = {
      id: this.editResponseData.id,
      responseText: this.editResponseData.responseText,
      responserCompanyId: this.editResponseData.responserCompanyId
    };
    this.responseService.updateResponse(requestCompanyId!, dto).subscribe({
      next: () => {
        // Обнови локално
        this.editResponseItem.responseText = dto.responseText;
        this.editResponseItem.responserCompanyId = dto.responserCompanyId;
        this.closeEditResponseDialog();
      },
      error: () => {
        alert('Грешка при редакция на предложение!');
      }
    });
  }

  // Преобразува масив [2025,6,16,0,0] или string към dd.MM.yyyy
  formatDateArray(date: any): string {
    if (!date) return '';
    if (Array.isArray(date) && date.length >= 3) {
      // month is 1-based in backend, 0-based in JS
      const d = new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0);
      return d.toLocaleDateString('bg-BG');
    }
    if (typeof date === 'string' || typeof date === 'number') {
      const d = new Date(date);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('bg-BG');
    }
    return '';
  }

  getCompanyName(id: string): string {
    const company = this.companies.find(c => String(c.id) === String(id));
    return company ? company.name + (company.vatNumber ? ' (' + company.vatNumber + ')' : '') : id || '';
  }

  canEditResponse(resp: any): boolean {
    return !!resp.responserCompanyId && this.companies.some(c => c.id === resp.responserCompanyId);
  }

  onPictureChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.responseForm.get('picture')?.setValue(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.picturePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.responseForm.get('picture')?.setValue(null);
      this.picturePreview = null;
    }
  }
}

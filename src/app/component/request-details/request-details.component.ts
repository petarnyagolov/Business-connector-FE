import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { EmailVerificationService } from '../../service/email-verification.service';
import { ResponseDialogComponent } from './response-dialog.component';

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatDialogModule
  ],
  templateUrl: './request-details.component.html',
  styleUrls: ['./request-details.component.scss']
})
export class RequestDetailsComponent implements OnInit, OnDestroy {
  request: CompanyRequest | null = null;
  responses: any[] = [];
  userCompanies: Company[] = [];
  requesterCompany: Company | null = null;
  editResponseData: any = {};
  editResponseItem: any = null;
  showEditResponseDialog: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private companyRequestService: CompanyRequestService,
    private companyService: CompanyService,
    private responseService: ResponseService,
    private fb: FormBuilder,
    private authService: AuthService,
    private emailVerificationService: EmailVerificationService,
    private dialog: MatDialog
  ) {
    this.loadUserCompanies();
  }

  loadUserCompanies(): void {
    this.companyService.getAllCompaniesByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.userCompanies = companies;
          console.log('Loaded companies:', this.userCompanies);
        },
        error: (error) => {
          console.error('Error loading user companies:', error);
          this.userCompanies = [];
        }
      });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.companyRequestService.getRequestById(id).subscribe(res => {
        this.request = res.request;
        this.responses = res.responses || [];
        
        if (this.request?.requesterCompanyId) {
          this.requesterCompany = this.userCompanies.find(
            company => company.id === this.request?.requesterCompanyId
          ) || null;
          
          if (!this.requesterCompany) {
            console.log('Requester company not found in user companies list');
          }
        }
      });
    }
  }

  private processResponseSubmission(formData: any): void {
    if (!this.request) return;
    
    const dto: any = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'picture') {
        if (key === 'message') {
          dto['responseText'] = formData.message;
        } else {
          dto[key] = formData[key];
        }
      }
    });
    
    const pictures: File[] = [];
    if (formData.picture) {
      pictures.push(formData.picture);
    }
    
    this.responseService.createResponse(this.request!.id, dto, pictures).subscribe({
      next: () => {
        this.loadResponses();
      },
      error: (error) => {
        console.error('Error submitting response:', error);
        alert('Възникна грешка при изпращането на предложението.');
      }
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
        this.editResponseItem.responseText = dto.responseText;
        this.editResponseItem.responserCompanyId = dto.responserCompanyId;
        this.closeEditResponseDialog();
      },
      error: () => {
        alert('Грешка при редакция на предложение!');
      }
    });
  }

  formatDateArray(date: any): string {
    if (!date) return '';
    if (Array.isArray(date) && date.length >= 3) {
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
    const company = this.userCompanies.find(c => String(c.id) === String(id));
    return company ? company.name + (company.vatNumber ? ' (' + company.vatNumber + ')' : '') : id || '';
  }

  canEditResponse(resp: any): boolean {
    return !!resp.responserCompanyId && this.userCompanies.some(c => c.id === resp.responserCompanyId);
  }



  getUnitLabel(unit: string): string {
    switch (unit) {
      case 'count': return 'Бр.';
      case 'box': return 'Кашон/и';
      case 'pallet': return 'Пале/та';
      default: return unit || '';
    }
  }

  openResponseModal(): void {
    console.log('Opening response dialog, companies:', this.userCompanies);
    
    this.emailVerificationService.checkVerificationOrPrompt().subscribe((canProceed: boolean) => {
      if (!canProceed) {
        return;
      }
      
      const dialogRef = this.dialog.open(ResponseDialogComponent, {
        width: '500px',
        data: {
          requestId: this.request?.id,
          requiredFields: this.request?.requiredFields || []
        }
      });
      
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.processResponseSubmission(result);
        }
      });
    });
  }

  loadResponses(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.request) {
      this.companyRequestService.getRequestById(id).subscribe(res => {
        this.responses = res.responses || [];
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

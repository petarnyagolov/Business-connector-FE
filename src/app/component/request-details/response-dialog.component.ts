import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { Company } from '../../model/company';
import { CompanyService } from '../../service/company.service';

export interface ResponseDialogData {
  requestId: string;
  requiredFields: string[];
}

@Component({
  selector: 'app-response-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <div style="display: flex; align-items: center; gap: 8px;">
        <mat-icon color="primary">reply</mat-icon>
        Изпрати предложение
      </div>
    </h2>
    <mat-dialog-content>
      <form [formGroup]="responseForm" style="display: flex; flex-direction: column; gap: 16px; min-width: 400px;">
        <mat-form-field appearance="fill" style="width: 100%;">
          <mat-label>Фирма</mat-label>
          <mat-select formControlName="responserCompanyId" required>
            <mat-option [value]="''">-- Избери Фирма --</mat-option>
            <mat-option *ngFor="let company of userCompanies" [value]="company.id">
              {{ company.name }} ({{ company.vatNumber }})
            </mat-option>
          </mat-select>
          <mat-error *ngIf="responseForm.get('responserCompanyId')?.hasError('required')">Фирмата е задължителна</mat-error>
          <mat-hint *ngIf="userCompanies.length === 0">Няма налични фирми</mat-hint>
          <mat-hint *ngIf="userCompanies.length > 0">Налични фирми: {{ userCompanies.length }}</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;">
          <mat-label>Съобщение</mat-label>
          <textarea matInput formControlName="message" rows="4" placeholder="Опишете вашето предложение..."></textarea>
          <mat-error *ngIf="responseForm.get('message')?.hasError('required')">Съобщението е задължително</mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('fixedPrice')">
          <mat-label>Фиксирана цена</mat-label>
          <input matInput type="number" formControlName="fixedPrice" required>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('priceFrom')">
          <mat-label>Цена от</mat-label>
          <input matInput type="number" formControlName="priceFrom" required>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('priceTo')">
          <mat-label>Цена до</mat-label>
          <input matInput type="number" formControlName="priceTo" required>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('availableFrom')">
          <mat-label>Налично от</mat-label>
          <input matInput [matDatepicker]="pickerFrom" formControlName="availableFrom" required placeholder="дд.мм.гггг">
          <mat-datepicker-toggle matSuffix [for]="pickerFrom"></mat-datepicker-toggle>
          <mat-datepicker #pickerFrom></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width: 100%;" *ngIf="isFieldRequired('availableTo')">
          <mat-label>Налично до</mat-label>
          <input matInput [matDatepicker]="pickerTo" formControlName="availableTo" required placeholder="дд.мм.гггг">
          <mat-datepicker-toggle matSuffix [for]="pickerTo"></mat-datepicker-toggle>
          <mat-datepicker #pickerTo></mat-datepicker>
        </mat-form-field>

        <div *ngIf="isFieldRequired('picture')" style="margin: 8px 0;">
          <label style="font-weight: 500; display: block; margin-bottom: 8px;">Снимка</label>
          <input type="file" (change)="onPictureChange($event)" accept="image/*" style="margin-bottom: 8px;">
          <img *ngIf="picturePreview" [src]="picturePreview" alt="Преглед" style="max-width: 120px; max-height: 120px; display: block; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Отказ</button>
      <button mat-raised-button color="primary" [disabled]="responseForm.invalid" (click)="onSubmit()">
        <mat-icon style="margin-right: 4px;">send</mat-icon>
        Изпрати предложение
      </button>
    </mat-dialog-actions>
  `,
})
export class ResponseDialogComponent implements OnInit, OnDestroy {
  responseForm: FormGroup;
  userCompanies: Company[] = [];
  picturePreview: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    public dialogRef: MatDialogRef<ResponseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResponseDialogData
  ) {
    this.responseForm = this.fb.group({
      responserCompanyId: ['', Validators.required],
      message: ['', Validators.required],
      fixedPrice: [''],
      priceFrom: [''],
      priceTo: [''],
      availableFrom: [null],
      availableTo: [null],
      picture: [null]
    });
    
    // Add required validators based on required fields
    if (data.requiredFields) {
      if (this.isFieldRequired('availableFrom')) {
        this.responseForm.get('availableFrom')?.addValidators(Validators.required);
        this.responseForm.get('availableFrom')?.updateValueAndValidity();
      }
      if (this.isFieldRequired('availableTo')) {
        this.responseForm.get('availableTo')?.addValidators(Validators.required);
        this.responseForm.get('availableTo')?.updateValueAndValidity();
      }
      if (this.isFieldRequired('fixedPrice')) {
        this.responseForm.get('fixedPrice')?.addValidators(Validators.required);
        this.responseForm.get('fixedPrice')?.updateValueAndValidity();
      }
      if (this.isFieldRequired('priceFrom')) {
        this.responseForm.get('priceFrom')?.addValidators(Validators.required);
        this.responseForm.get('priceFrom')?.updateValueAndValidity();
      }
      if (this.isFieldRequired('priceTo')) {
        this.responseForm.get('priceTo')?.addValidators(Validators.required);
        this.responseForm.get('priceTo')?.updateValueAndValidity();
      }
    }
  }

  ngOnInit(): void {
    this.loadUserCompanies();
  }

  loadUserCompanies(): void {
    console.log('Loading user companies...');
    this.companyService.getAllCompaniesByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.userCompanies = companies;
          console.log(`Loaded ${this.userCompanies.length} companies:`, this.userCompanies);
        },
        error: (error) => {
          console.error('Error loading user companies:', error);
          this.userCompanies = [];
        }
      });
  }
  
  isFieldRequired(field: string): boolean {
    return this.data.requiredFields?.includes(field) || false;
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

  onSubmit(): void {
    if (this.responseForm.valid) {
      const result = {
        ...this.responseForm.value,
        responseText: this.responseForm.get('message')?.value
      };
      this.dialogRef.close(result);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
